import { Command } from "./command.ts";
import { integer, number, string } from "./types.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.118.0/testing/asserts.ts";

Deno.test("basic commands", () => {
  const cmd = new Command("A test command.")
    .required(string, "firstName")
    .required(string, "name")
    .optional(number, "age", { flags: ["a", "age"] });

  const result = cmd.parse(["Peter", "Parker", "--age", "42"]);
  assertEquals(result, { firstName: "Peter", name: "Parker", age: 42 });
});

Deno.test("help output", () => {
  const cmd = new Command("A test command.")
    .required(string, "first")
    .required(string, "second")
    .optional(number, "age", {
      flags: ["a", "age"],
      description: "The age option.",
    })
    .required(integer, "index", { flags: ["i", "index"] })
    .optional(string, "other", {
      flags: ["o", "other"],
      description: "Other option.",
    })
    .flag("flag", {
      aliases: ["f", "a-flag"],
      description: "This is a flag.",
    });

  assertEquals(
    cmd.help(),
    `A test command.

USAGE:
\t<first> <second> [OPTIONS]

OPTIONS:
\t-a, --age <NUMBER>                The age option.
\t-i, --index <INTEGER> (required)  
\t-o, --other <STRING>              Other option.
\t--flag, -f, --a-flag              This is a flag.`,
  );
});

Deno.test("basic command errors", () => {
  const cmd = new Command("A test command.")
    .required(string, "name", { flags: ["n", "name"] });

  assertThrows(() => {
    cmd.parse(["--wrong-flag", "Peter Parker"]);
  });
  assertThrows(() => {
    cmd.parse(["-n"]);
  });
});
