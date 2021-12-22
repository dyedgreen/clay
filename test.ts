import { choice, Command, CommandGroup, number, string } from "./mod.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.118.0/testing/asserts.ts";

Deno.test("test basic functionality", () => {
  const cmd = new Command("A test command.")
    .required(string, "firstName")
    .required(string, "name")
    .optional(number, "age", { flags: ["a", "age"] });

  assertEquals(
    cmd.help(),
    `A test command.\n\nUSAGE:\n\t<firstName> <name> [OPTIONS]\n\nOPTIONS:\n\t-a, --age <NUMBER>`,
  );

  const result = cmd.parse(["Peter", "Parker", "--age", "42"]);
  assertEquals(result, { firstName: "Peter", name: "Parker", age: 42 });
});

Deno.test("test basic command groups", () => {
  const firstCmd = new Command("First command.")
    .required(choice("NUMBER", ["one", "two", "three"]), "number", {
      flags: ["n", "number"],
    });
  const secondCmd = new Command("Second command.")
    .required(string, "name", {
      flags: ["n", "name"],
    });
  const group = new CommandGroup("A test group.")
    .subcommand("first", firstCmd)
    .subcommand("second", secondCmd);

  const firstResult = group.parse(["first", "-n", "two"]);
  assertEquals(firstResult, { first: { number: "two" } });

  const secondResult = group.parse(["second", "--name", "Peter"]);
  assertEquals(secondResult, { second: { name: "Peter" } });
});

Deno.test("basic error test", () => {
  const cmd = new Command("A test command.")
    .required(string, "name", { flags: ["n", "name"] });

  assertThrows(() => {
    cmd.parse(["--wrong-flag", "Peter Parker"]);
  });
  assertThrows(() => {
    cmd.parse(["-n"]);
  });
});
