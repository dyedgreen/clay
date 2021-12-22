import { ArgumentError } from "./error.ts";

export interface ArgumentType<T> {
  readonly parse: (raw: string) => T;
  readonly typeName: string;
}

function escapeRawArgument(string: string) {
  return `'${string.replaceAll("'", "\\'")}'`;
}

export const string: ArgumentType<string> = Object.freeze({
  parse: (raw: string): string => raw,
  typeName: "STRING",
});

export const number: ArgumentType<number> = Object.freeze({
  parse: (raw: string): number => {
    const num = Number(raw);
    if (!Number.isNaN(num)) {
      return num;
    } else {
      throw new ArgumentError(`${escapeRawArgument(raw)} is not a number`);
    }
  },
  typeName: "NUMBER",
});

export const integer: ArgumentType<number> = Object.freeze({
  parse: (raw: string): number => {
    if (/^[-+]?\d+$/.test(raw)) {
      return Number(raw);
    } else {
      throw new ArgumentError(`${escapeRawArgument(raw)} is not an integer`);
    }
  },
  typeName: "INTEGER",
});

export const boolean: ArgumentType<boolean> = Object.freeze({
  parse: (raw: string): boolean => {
    const truthy = ["yes", "true", "y", "1"];
    const falsey = ["no", "false", "n", "0"];
    if (truthy.includes(raw.toLowerCase())) {
      return true;
    } else if (falsey.includes(raw.toLowerCase())) {
      return false;
    } else {
      throw new ArgumentError(`${escapeRawArgument(raw)} is not a boolean`);
    }
  },
  typeName: "BOOLEAN",
});

export const choice = function <C extends string[]>(
  typeName: string,
  choices: C,
): ArgumentType<C[number]> {
  return Object.freeze({
    parse: (raw: string): C[number] => {
      if (choices.includes(raw)) {
        return raw;
      } else {
        throw new ArgumentError(
          `expected one of ${
            choices.map(escapeRawArgument).join(", ")
          } but received ${escapeRawArgument(raw)}`,
        );
      }
    },
    typeName: typeName.toUpperCase(),
  });
};
