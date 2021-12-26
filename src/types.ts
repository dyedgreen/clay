/**
 * A parser that can read a single argument
 * value.
 *
 * Implement this interface to provide parsers
 * for custom argument types.
 */
export interface ArgumentType<T> {
  /**
   * Function which parses a single argument. If
   * the parsing fails, this should throw an error.
   */
  readonly parse: (raw: string) => T;

  /**
   * Type name to use when displaying help and
   * error messages.
   */
  readonly typeName: string;
}

function escapeRawArgument(string: string) {
  return `'${string.replaceAll("'", "\\'")}'`;
}

/**
 * Returns the provided CLI argument as a `string` without
 * performing any validation.
 */
export const string: ArgumentType<string> = Object.freeze({
  parse: (raw: string): string => raw,
  typeName: "STRING",
});

/**
 * Returns the provided CLI argument as a `number`.
 * `Infinity` and `Nan` are not valid numbers.
 */
export const number: ArgumentType<number> = Object.freeze({
  parse: (raw: string): number => {
    const value = raw.trim().toLowerCase();
    const num = Number(value);
    if (value.length > 0 && !Number.isNaN(num)) {
      return num;
    } else {
      throw new Error(`${escapeRawArgument(raw)} is not a number`);
    }
  },
  typeName: "NUMBER",
});

/**
 * Returns the provided CLI argument as a `number`, if it is an
 * integer.
 */
export const integer: ArgumentType<number> = Object.freeze({
  parse: (raw: string): number => {
    const value = raw.trim();
    if (/^[-+]?\d+$/.test(value)) {
      const number = Number(value);
      if (Object.is(number, -0)) return 0;
      else return number;
    } else {
      throw new Error(`${escapeRawArgument(raw)} is not an integer`);
    }
  },
  typeName: "INTEGER",
});

/**
 * Return the provided CLI argument as a `boolean`. Case-insensitive
 * versions of `yes`/`no`, `true`/`false`, `y`/`n`, `1`/`0` are all
 * accepted.
 */
export const boolean: ArgumentType<boolean> = Object.freeze({
  parse: (raw: string): boolean => {
    const truthy = ["yes", "true", "y", "1"];
    const falsey = ["no", "false", "n", "0"];
    const value = raw.trim().toLowerCase();
    if (truthy.includes(value)) {
      return true;
    } else if (falsey.includes(value)) {
      return false;
    } else {
      throw new Error(`${escapeRawArgument(raw)} is not a boolean`);
    }
  },
  typeName: "BOOLEAN",
});

/**
 * Returns a value from a provided set of options, if the CLI argument
 * matches. Options are matched case-insensitively e.g.
 * `choice("CONFIRM", ["yes", "no"])` matches both `yes` and `Yes`.
 *
 * This always returns exact string provided in `choices`, e.g.
 * `choice("CONFIRM", ["yes", "no"])`, matching on `Yes` would return
 * `yes`.
 */
export function choice<C extends string[]>(
  typeName: string,
  choices: C,
): ArgumentType<C[number]> {
  const choiceMap: Map<string, string> = choices.reduce((map, choice) => {
    map.set(choice.toLowerCase(), choice);
    return map;
  }, new Map());
  return Object.freeze({
    parse: (raw) => {
      const key = raw.trim().toLowerCase();
      if (choiceMap.has(key)) {
        return choiceMap.get(key)!;
      } else {
        throw new Error(
          `expected one of ${
            choices.map(escapeRawArgument).join(", ")
          } but received ${escapeRawArgument(raw)}`,
        );
      }
    },
    typeName: typeName.toUpperCase(),
  });
}
