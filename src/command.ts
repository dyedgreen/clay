import type { ArgumentType } from "./types.ts";
import { ArgumentError, HelpError } from "./error.ts";
import { leftPad } from "./fmt.ts";
import { closest } from "./distance.ts";

export interface ArgumentOptions {
  /**
   * If `flags` is set, the argument is passed
   * as a named flag, e.g. `--name value`. Otherwise,
   * the argument will be an anonymous positional
   * argument.
   */
  readonly flags: string[];

  /**
   * A description to display in the generated
   * help messages.
   */
  readonly description?: string;
}

export interface FlagOptions {
  /**
   * A set of aliases for the flag's `name`. If
   * any of the aliases, or `--{name}` are passed,
   * the flag is set to true.
   */
  readonly aliases?: string[];

  /**
   * A description to display in the generated
   * help messages.
   */
  readonly description?: string;
}

interface Argument {
  readonly name: string;
  readonly description?: string;
  readonly type: ArgumentType<unknown>;
}

interface Flags {
  readonly name: string;
  readonly description?: string;
  readonly flags: string[];
}

/**
 * A `Command` groups a set of arguments, which
 * can be parsed from a given command line.
 */
export class Command<T = Record<never, never>> {
  readonly description: string;

  private _requiredPositional: Argument[];
  private _optionalPositional: Argument | null;
  private _allNamed: (Argument & Flags)[];
  private _flags: Flags[];

  private _requiredNamed: Set<string>;
  private _allFlags: Set<string>;

  /**
   * Create a new `Command`. The `description` is
   * displayed in the generated help messages.
   */
  constructor(description: string) {
    this.description = description;

    this._requiredPositional = [];
    this._optionalPositional = null;
    this._allNamed = [];
    this._flags = [];

    this._requiredNamed = new Set();
    this._allFlags = new Set();
  }

  private _fmtOptions(): string {
    const pairs = [];
    for (const arg of this._allNamed) {
      const flags = arg.flags.join(", ");
      const required = this._requiredNamed.has(arg.name) ? " (required)" : "";
      pairs.push([
        `${flags} <${arg.type.typeName}>${required}`,
        arg.description ?? "",
      ]);
    }
    for (const flag of this._flags) {
      pairs.push([flag.flags.join(", "), flag.description ?? ""]);
    }
    const maxLength = pairs.reduce(
      (max, [first, _]) => Math.max(max, first.length),
      0,
    );
    return `OPTIONS:\n${
      pairs.map(([first, second]) =>
        second.length
          ? `\t${leftPad(first, maxLength)}  ${second}`
          : `\t${first}`
      )
        .join("\n")
    }`;
  }

  private _fmtUsage(path: string[]): string {
    const required = this._requiredPositional
      .map((arg) => `<${arg.name}>`)
      .join(" ");
    const optional = this._optionalPositional
      ? ` [${this._optionalPositional.name}]`
      : "";
    const flags = this._allNamed.length + this._flags.length > 0
      ? " [OPTIONS]"
      : "";
    return `USAGE:\n\t${
      path.join(" ") + (path.length ? " " : "") + required + optional + flags
    }`;
  }

  private _fmtMissingPositional(path: string[], arg: Argument): string {
    return `Missing argument <${arg.name}>\n\n${this._fmtUsage(path)}`;
  }

  private _fmtMissingNamed(arg: Argument & Flags): string {
    return `Missing argument ${arg.flags.join(", ")} <${arg.type.typeName}>`;
  }

  private _fmtPositionalArgParseError(arg: Argument, error: Error): string {
    return `Invalid argument <${arg.name}>: ${error.message}`;
  }

  private _fmtNamedArgParseError(
    arg: Argument,
    flag: string,
    error: Error,
  ): string {
    return `Invalid argument ${flag} <${arg.type.typeName}>: ${error.message}`;
  }

  private _fmtUnknownFlag(arg: string): string {
    const unknownFlag = `Unknown flag '${arg.replaceAll("'", "\\'")}'`;
    const closestFlag = closest(arg, this._allFlags);
    if (closestFlag) {
      return `${unknownFlag}\n\nHELP:\n\tDid you mean ${closestFlag}?`;
    } else {
      return unknownFlag;
    }
  }

  private _normalizeFlags(flags: string[]): string[] {
    return flags.filter((flag) => flag.length).map((flag) => {
      if (flag.startsWith("-")) {
        return flag;
      } else if (flag.length > 1) {
        return "--" + flag;
      } else {
        return "-" + flag;
      }
    });
  }

  private _parseValue(arg: Argument, value: string, flag?: string): unknown {
    try {
      return arg.type.parse(value);
    } catch (error) {
      if (flag != null) {
        throw new ArgumentError(this._fmtNamedArgParseError(arg, flag, error));
      } else {
        throw new ArgumentError(this._fmtPositionalArgParseError(arg, error));
      }
    }
  }

  /**
   * Add a required argument and return the modified
   * `Command`.
   *
   * The parsed argument will be present at key `name`
   * in the object returned from `parse` or `run`.
   *
   * # Example
   * ```javascript
   * const cmd = new Command()
   *   .required(string, "name", { flags: ["n", "name"], description: "The name." });
   * ```
   */
  required<Type, Name extends string>(
    type: ArgumentType<Type>,
    name: Name,
    options?: ArgumentOptions,
  ): Command<T & { [name in Name]: Type }> {
    if (!options?.flags?.length) {
      // positional argument
      if (this._optionalPositional != null) {
        throw new Error(
          "required positional arguments must come before optional ones",
        );
      }
      this._requiredPositional.push({
        name,
        description: options?.description,
        type,
      });
    } else {
      // named argument
      const flags = this._normalizeFlags(options.flags);
      flags.forEach((flag) => this._allFlags.add(flag));
      this._allNamed.push({
        name,
        description: options?.description,
        type,
        flags,
      });
      this._requiredNamed.add(name);
    }
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  /**
   * Add an optional argument and return the modified
   * `Command`.
   *
   * If the optional argument was passed, it will be present
   * at key `name` in the object returned from `parse` or `run`.
   * Otherwise, the object will not contain the key `name`.
   *
   * # Example
   * ```javascript
   * const cmd = new Command()
   *   .optional(string, "name", { flags: ["n", "name"], description: "The name." });
   * ```
   */
  optional<Type, Name extends string>(
    type: ArgumentType<Type>,
    name: Name,
    options?: ArgumentOptions,
  ): Command<T & { [name in Name]: Type | null }> {
    if (!options?.flags?.length) {
      // positional argument
      if (this._optionalPositional != null) {
        throw new Error(
          "there can be at most one optional positional argument",
        );
      }
      this._optionalPositional = {
        name,
        description: options?.description,
        type,
      };
    } else {
      // named argument
      const flags = this._normalizeFlags(options.flags);
      flags.forEach((flag) => this._allFlags.add(flag));
      this._allNamed.push({
        name,
        description: options?.description,
        type,
        flags,
      });
    }
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  /**
   * Add a `boolean` flag and return the modified
   * `Command`.
   *
   * # Example
   * ```javascript
   * const cmd = new Command()
   *   .flag("flag", { aliases: ["f", "the-flag"], description: "The flag." });
   * ```
   */
  flag<Name extends string>(
    name: Name,
    options?: FlagOptions,
  ): Command<T & { [name in Name]: boolean }> {
    let flags: string[] = [name];
    flags = this._normalizeFlags(
      options?.aliases ? flags.concat(options.aliases) : flags,
    );
    flags.forEach((flag) => this._allFlags.add(flag));
    this._flags.push({
      name,
      description: options?.description,
      flags,
    });
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  /**
   * Return the generated help message.
   */
  help(path: string[] = []): string {
    const sections = [
      this.description,
      this._fmtUsage(path),
    ];
    if (this._allNamed.length + this._flags.length) {
      sections.push(this._fmtOptions());
    }
    return sections.join("\n\n").trim();
  }

  /**
   * Parse `args`, starting from `skip`. If the
   * argument list does not match the `Command`,
   * this throws an error.
   */
  parse(args: string[], skip = 0): T {
    const isHelp = args.some((arg, idx) => {
      if (idx < skip) return false;
      const argClean = arg.trim().toLowerCase();
      return argClean === "-h" || argClean === "--help";
    });
    if (isHelp) {
      throw new HelpError(this.help(args.slice(0, skip)));
    } else {
      const result: Record<string, unknown> = {};

      // required positional arguments
      const endOfRequired = skip + this._requiredPositional.length;
      for (let i = skip; i < endOfRequired; i++) {
        const arg = this._requiredPositional[i - skip];
        if (i >= args.length) {
          throw new ArgumentError(
            this._fmtMissingPositional(args.slice(0, skip), arg),
          );
        } else {
          result[arg.name] = this._parseValue(arg, args[i]);
        }
      }

      // optional positional argument
      let flagsStart = endOfRequired;
      if (
        this._optionalPositional &&
        args.length > endOfRequired &&
        !this._allFlags.has(args[endOfRequired])
      ) {
        result[this._optionalPositional.name] = this._parseValue(
          this._optionalPositional,
          args[endOfRequired],
        );
        flagsStart += 1;
      }

      // flags and named arguments
      outerLoop:
      for (let i = flagsStart; i < args.length; i++) {
        if (!this._allFlags.has(args[i])) {
          throw new ArgumentError(
            this._fmtUnknownFlag(args[i]),
          );
        }
        for (const namedArg of this._allNamed) {
          if (namedArg.flags.includes(args[i])) {
            if (i + 1 < args.length) {
              result[namedArg.name] = this._parseValue(
                namedArg,
                args[i + 1],
                args[i],
              );
              i += 1;
              continue outerLoop;
            } else {
              throw new ArgumentError(this._fmtMissingNamed(namedArg));
            }
          }
        }
        for (const flag of this._flags) {
          if (flag.flags.includes(args[i])) {
            result[flag.name] = true;
            continue outerLoop;
          }
        }
      }

      // check for missing arguments
      for (const name of this._requiredNamed) {
        if (!Object.hasOwn(result, name)) {
          const arg = this._allNamed.find((arg) => arg.name === name);
          throw new ArgumentError(this._fmtMissingNamed(arg!));
        }
      }

      // fill optional arguments flags
      if (
        this._optionalPositional &&
        !Object.hasOwn(result, this._optionalPositional.name)
      ) {
        result[this._optionalPositional.name] = null;
      }
      for (const flag of this._flags) {
        if (!Object.hasOwn(result, flag.name)) result[flag.name] = false;
      }
      for (const arg of this._allNamed) {
        if (!Object.hasOwn(result, arg.name)) result[arg.name] = null;
      }

      return result as T;
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
   * // obtain cmd ...
   * const options = cmd.run();
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
