import { Command } from "./command.ts";
import { CommandGroup } from "./group.ts";
import { string } from "./types.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.118.0/testing/asserts.ts";

const cmd = new Command("Test child.").required(string, "test");

Deno.test("command groups work", () => {
  const group = new CommandGroup("A test group.")
    .subcommand("first", cmd)
    .subcommand("second", cmd);

  const firstResult = group.parse(["first", "test"]);
  assertEquals(firstResult, { first: { test: "test" } });

  const secondResult = group.parse(["second", "test"]);
  assertEquals(secondResult, { second: { test: "test" } });
});

Deno.test("command group errors work", () => {
  const group = new CommandGroup("A test group.")
    .subcommand("first", cmd)
    .subcommand("second", cmd);

  assertThrows(() => group.parse(["bad-key", "test"]));
  assertThrows(() => group.parse(["FIRST", "test"]));
  assertThrows(() => group.parse(["Second", "test"]));
  assertThrows(() => group.parse(["first", "test", "too many"]));
  assertThrows(() => group.parse(["first"]));
});

Deno.test("command group help messages shows closest subcommand", () => {
  const group = new CommandGroup("A test command.")
    .subcommand("test", cmd);

  let message = "";
  try {
    group.parse(["tst"]);
  } catch (error) {
    message = error.message;
  }
  assertEquals(
    message,
    "Unknown command 'tst'\n\nHELP:\n\tDid you mean test?",
  );
});

Deno.test("command group help output", () => {
  const innerGroup = new CommandGroup("Inner group.")
    .subcommand("first", cmd)
    .subcommand("second", cmd);
  const group = new CommandGroup("A test group.")
    .subcommand("first", cmd)
    .subcommand("second", cmd)
    .subcommand("third", innerGroup);

  assertEquals(
    group.help(),
    `A test group.

USAGE:
\t<command>

COMMANDS:
\tfirst   Test child.
\tsecond  Test child.
\tthird   Inner group.`,
  );

  let innerHelp = "";
  try {
    group.parse(["third", "-h"]);
  } catch (error) {
    innerHelp = error.message;
  }
  assertEquals(
    innerHelp,
    `Inner group.

USAGE:
\tthird <command>

COMMANDS:
\tfirst   Test child.
\tsecond  Test child.`,
  );
});
