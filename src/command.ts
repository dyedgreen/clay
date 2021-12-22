import type { ArgumentType } from "./types.ts";
import { ArgumentError, CommandError } from "./error.ts";

export interface ArgumentOptions {
  flags?: string[];
  description?: string;
}

export interface FlagOptions {
  aliases?: string[];
  description?: string;
}

interface Argument {
  name: string;
  description?: string;
  type: ArgumentType<unknown>;
}

interface Flags {
  name: string;
  description?: string;
  flags: string[];
}

export class Command<T = Record<never, never>> {
  readonly description: string;

  private _requiredPositional: Argument[];
  private _optionalPositional: Argument | null;
  private _allNamed: (Argument & Flags)[];
  private _flags: Flags[];

  private _requiredNamed: string[];
  private _allFlags: Set<string>;

  constructor(description: string) {
    this.description = description;

    this._requiredPositional = [];
    this._optionalPositional = null;
    this._allNamed = [];
    this._flags = [];

    this._requiredNamed = [];
    this._allFlags = new Set();
  }

  private _fmtOptions(): string {
    return "FIXME ... ";
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
    return `USAGE:\n\t${path.join(" ") + required + optional + flags}`;
  }

  private _fmtMissingPositional(path: string[], arg: Argument): string {
    return `Missing argument <${arg.name}>\n\n${this._fmtUsage(path)}`;
  }

  private _fmtMissingNamed(arg: Argument & Flags): string {
    return `Missing argument ${arg.flags} <${arg.type.typeName}>`;
  }

  private _fmtPositionalArgParseError(arg: Argument, error: Error): string {
    return `Invalid argument <${arg.name}>: ${error.message}`;
  }

  private _fmtNamedArgParseError(
    arg: Argument,
    flag: string,
    error: Error,
  ): string {
    return `Invalid argument ${flag} <${arg.name}>: ${error.message}`;
  }

  private _fmtUnknownFlag(path: string[], arg: string): string {
    return `Unknown flag ${arg}\n\n${this._fmtUsage(path)}`;
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

  required<Type, Name extends string>(
    type: ArgumentType<Type>,
    name: Name,
    options?: ArgumentOptions,
  ): Command<T & { [name in Name]: Type }> {
    if (!options?.flags?.length) {
      // positional argument
      if (this._optionalPositional != null) {
        throw new CommandError(
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
      this._requiredNamed.push(name);
    }
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  optional<Type, Name extends string>(
    type: ArgumentType<Type>,
    name: Name,
    options?: ArgumentOptions,
  ): Command<T & { [name in Name]: Type | null }> {
    if (!options?.flags?.length) {
      // positional argument
      if (this._optionalPositional != null) {
        throw new CommandError(
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

  parse(args: string[], skip = 0): T {
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
    for (const flag of this._flags) result[flag.name] = false;
    outerLoop:
    for (let i = flagsStart; i < args.length; i++) {
      if (!this._allFlags.has(args[i])) {
        throw new ArgumentError(
          this._fmtUnknownFlag(args.slice(0, skip), args[i]),
        );
      }
      for (const namedArg of this._allNamed) {
        if (namedArg.flags.includes(args[i])) {
          result[namedArg.name] = this._parseValue(
            namedArg,
            args[i + 1],
            args[i],
          );
          i += 1;
          continue outerLoop;
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
    return result as T;
  }

  run(): T {
    throw new Error("TODO");
  }
}
