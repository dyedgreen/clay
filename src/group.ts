import type { Command } from "./command.ts";

export class CommandGroup<T = Record<never, never>> {
  readonly description: string;

  constructor(description: string) {
    this.description = description;
  }

  subcommand<Type, Name extends string>(
    name: Name,
    command: Command<Type> | CommandGroup<Type>,
  ): CommandGroup<T | { [name in Name]: Type }> {
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
