export class ArgumentError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class CommandError extends Error {
  constructor(message: string) {
    super(message);
  }
}
