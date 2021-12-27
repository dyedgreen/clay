import type { Command } from "./command.ts";
import { ArgumentError, HelpError } from "./error.ts";
import { leftPad } from "./fmt.ts";
import { closest } from "./distance.ts";

/**
 * A group of `Command`s.
 */
export class CommandGroup<T = Record<never, never>> {
  readonly description: string;

  private _commands: Record<string, Command<unknown> | CommandGroup<unknown>>;

  /**
   * Create a new `CommandGroup`. The `description`
   * is displayed in the generated help messages.
   */
  constructor(description: string) {
    this.description = description;
    this._commands = {};
  }

  private _fmtUsage(path: string[]): string {
    return `USAGE:\n\t${path.join(" ")}${path.length ? " " : ""}<command>`;
  }

  private _fmtCommands() {
    const pairs = Object.entries(this._commands);
    const maxLength = pairs.reduce(
      (max, [name, _]) => Math.max(max, name.length),
      0,
    );
    return `COMMANDS:\n${
      pairs.map(([name, command]) =>
        `\t${leftPad(name, maxLength)}  ${command.description}`
      ).join("\n")
    }`;
  }

  private _fmtUnknownCommand(arg: string): string {
    const unknownCommand = `Unknown command '${arg.replaceAll("'", "\\'")}'`;
    const closestCommand = closest(
      arg,
      Object.getOwnPropertyNames(this._commands),
    );
    if (closestCommand) {
      return `${unknownCommand}\n\nHELP:\n\tDid you mean ${closestCommand}?`;
    } else {
      return unknownCommand;
    }
  }

  /**
   * Add a sub command, which can either be a `Command`,
   * or another `CommandGroup`.
   *
   * If the sub command is selected, it's parsed result
   * will be present at key `name` in the object returned
   * from `parse` or `run`. Otherwise, the object will not
   * contain the key `name`.
   */
  subcommand<Type, Name extends string>(
    name: Name,
    command: Command<Type> | CommandGroup<Type>,
  ): CommandGroup<T & { [name in Name]?: Type }> {
    this._commands[name] = command as Command<unknown>;
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  /**
   * Return the generated help message.
   */
  help(path: string[] = []): string {
    return [
      this.description,
      this._fmtUsage(path),
      this._fmtCommands(),
    ].join("\n\n").trim();
  }

  /**
   * Parse `args`, starting from `skip`. If the
   * argument list does not match the `CommandGroup`,
   * this throws an error.
   */
  parse(args: string[], skip = 0): T {
    if (skip >= args.length) {
      throw new ArgumentError(this.help(args.slice(0, skip)));
    } else if (args[skip] in this._commands) {
      return {
        [args[skip]]: this._commands[args[skip]].parse(args, skip + 1),
      } as unknown as T;
    } else {
      const isHelp = args.some((arg, idx) => {
        if (idx < skip) return false;
        const argClean = arg.trim().toLowerCase();
        return argClean === "-h" || argClean === "--help";
      });
      if (isHelp) {
        throw new HelpError(this.help(args.slice(0, skip)));
      } else {
        throw new ArgumentError(this._fmtUnknownCommand(args[skip]));
      }
    }
  }

  /**
   * Parse the arguments from `Deno.args`.
   *
   * This will print errors to `Deno.stderr`.
   * If a `-h` or `--help` flag is provided,
   * a help message is printed to `Deno.stdout`.
   * This also exits the process with the appropriate
   * return codes.
   *
   * # Example
   * Typically, you would call this at the start
   * of your program:
   * ```javascript
   * // obtain group ...
   * const options = group.run();
   * // use options ...
   * ```
   */
  run(): T {
    try {
      return this.parse(Deno.args);
    } catch (error) {
      if (error instanceof ArgumentError) {
        const errorBytes = new TextEncoder().encode(error.message + "\n");
        Deno.stderr.writeSync(errorBytes);
        Deno.exit(1);
      } else if (error instanceof HelpError) {
        const errorBytes = new TextEncoder().encode(error.message + "\n");
        Deno.stdout.writeSync(errorBytes);
        Deno.exit(0);
      } else {
        throw error;
      }
    }
  }
}
