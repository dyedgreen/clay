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
    const value = raw.trim();
    const num = Number(value);
    if (value.length > 0 && !Number.isNaN(num)) {
      return num;
    } else {
      throw new Error(`${escapeRawArgument(raw)} is not a number`);
    }
  },
  typeName: "NUMBER",
});

export const integer: ArgumentType<number> = Object.freeze({
  parse: (raw: string): number => {
    const value = raw.trim();
    if (/^[-+]?\d+$/.test(value)) {
      const number = Number(value);
      if (number === -0) return 0;
      else return number;
    } else {
      throw new Error(`${escapeRawArgument(raw)} is not an integer`);
    }
  },
  typeName: "INTEGER",
});

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

export const choice = function <C extends string[]>(
  typeName: string,
  choices: C,
): ArgumentType<C[number]> {
  const choiceMap: Map<string, string> = choices.reduce((map, choice) => {
    map.set(choice.toLowerCase(), choice);
    return map;
  }, new Map());
  return Object.freeze({
    parse: (raw: string): C[number] => {
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
};
