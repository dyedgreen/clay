// TODO: better naming?
export class ArgumentError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class HelpError extends Error {
  constructor(message: string) {
    super(message);
  }
}
