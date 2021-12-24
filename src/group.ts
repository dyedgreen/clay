import type { Command } from "./command.ts";
import { ArgumentError, HelpError } from "./error.ts";
import { leftPad } from "./fmt.ts";

export class CommandGroup<T = Record<never, never>> {
  readonly description: string;

  private _commands: Record<string, Command<unknown> | CommandGroup<unknown>>;

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
    return `COMMANDS:\n\n${
      pairs.map(([name, command]) =>
        `\t${leftPad(name, maxLength)}  ${command.description}`
      ).join("\n")
    }`;
  }

  subcommand<Type, Name extends string>(
    name: Name,
    command: Command<Type> | CommandGroup<Type>,
  ): CommandGroup<T & { [name in Name]?: Type }> {
    this._commands[name] = command as Command<unknown>;
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  help(path: string[] = []): string {
    return [
      this.description,
      this._fmtUsage(path),
      this._fmtCommands(),
    ].join("\n\n").trim();
  }

  parse(args: string[], skip = 0): T {
    if (skip >= args.length) {
      throw new ArgumentError(this.help(args.slice(0, skip)));
    } else if (args[skip] in this._commands) {
      return {
        [args[skip]]: this._commands[args[skip]].parse(args, skip + 1),
      } as unknown as T;
    } else {
      const isHelp = Deno.args.some((arg, idx) => {
        if (idx < skip) return false;
        return arg === "-h" || arg === "--help";
      });
      if (isHelp) {
        throw new HelpError(this.help(args.slice(0, skip)));
      } else {
        throw new ArgumentError(
          `Unknown command ${args[skip].replaceAll("'", "\\'")}`,
        );
      }
    }
  }

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
