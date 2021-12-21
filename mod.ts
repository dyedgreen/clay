type Empty = Record<never, never>;

type Result<T, E> = { ok: T } | { error: E };

export interface ArgumentType<T> {
  parse: (raw: string) => Result<T, string>;
  typeName: string;
  description?: string;
}

interface ArgumentOptions {
  aliases?: string[];
  description?: string;
}

function escape(string: string) {
  return `'${string.replaceAll("'", "\\'")}'`;
}

export const string: ArgumentType<string> = Object.freeze({
  parse: (raw: string): Result<string, never> => {
    return { ok: raw };
  },
  typeName: "STRING",
});

export const number: ArgumentType<number> = Object.freeze({
  parse: (raw: string): Result<number, string> => {
    const num = Number(raw);
    if (Number.isNaN(num)) {
      return { error: `${escape(raw)} is not a number` };
    } else {
      return { ok: num };
    }
  },
  typeName: "NUMBER",
});

export const choice = function <C extends string[]>(
  typeName: string,
  choices: C,
): ArgumentType<C[number]> {
  return Object.freeze({
    parse: (raw: string): Result<typeof choices[number], string> => {
      if (choices.includes(raw)) {
        return { ok: raw };
      } else {
        return {
          error: `expected one of ${
            choices.map(escape).join(", ")
          } but received ${escape(raw)}`,
        };
      }
    },
    typeName: typeName.toUpperCase(),
  });
};

export class Command<T = Empty> {
  description: string;

  constructor(description: string) {
    this.description = description;
  }

  required<Type, Name extends string>(
    type: ArgumentType<Type>,
    name: Name,
    options?: ArgumentOptions,
  ): Command<Omit<T, Name> & { [name in Name]: Type }> {
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  optional<Type, Name extends string>(
    type: ArgumentType<Type>,
    name: Name,
    options?: ArgumentOptions,
  ): Command<Omit<T, Name> & { [name in Name]: Type | null }> {
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  flag<Name extends string>(
    name: Name,
    aliases?: string[],
  ): Command<Omit<T, Name> & { [name in Name]: boolean }> {
    // deno-lint-ignore no-explicit-any
    return this as any;
  }

  parse(_args: string[]): T {
    throw new Error("TODO");
  }
}
