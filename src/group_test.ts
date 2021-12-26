import { Command } from "./command.ts";
import { CommandGroup } from "./group.ts";
import { choice, string } from "./types.ts";
import { assertEquals } from "https://deno.land/std@0.118.0/testing/asserts.ts";

Deno.test("basic command groups", () => {
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
