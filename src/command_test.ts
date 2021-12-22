import { Command } from "./command.ts";
import { number, string } from "./types.ts";
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
