import type { ArgumentType } from "./types.ts";
import { CommandError } from "./error.ts";

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
  private _required: (Argument & Flags)[];
  private _optional: (Argument & Flags)[];
  private _flags: Flags[];

  constructor(description: string) {
    this.description = description;

    this._requiredPositional = [];
    this._optionalPositional = null;
    this._required = [];
    this._optional = [];
    this._flags = [];
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
      this._required.push({
        name,
        description: options?.description,
        type,
        flags: options?.flags,
      });
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
      this._optional.push({
        name,
        description: options?.description,
        type,
        flags: options?.flags,
      });
    }
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  flag<Name extends string>(
    name: Name,
    options?: FlagOptions,
  ): Command<T & { [name in Name]: boolean }> {
    const flags: string[] = [name];
    if (options?.aliases) {
      flags.concat(options?.aliases);
    }
    this._flags.push({
      name,
      description: options?.description,
      flags,
    });
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  parse(args: string[]): T {
    throw new Error("TODO");
  }

  run(): T {
    throw new Error("TODO");
  }
}
