import { Command } from "./command.ts";
import { integer, number, string } from "./types.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.118.0/testing/asserts.ts";

Deno.test("basic command usage", () => {
  const cmd = new Command("A test command.")
    .required(string, "firstName")
    .required(string, "name")
    .optional(number, "age", { flags: ["a", "age"] });

  const result = cmd.parse(["Peter", "Parker", "--age", "42"]);
  assertEquals(result, { firstName: "Peter", name: "Parker", age: 42 });
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

Deno.test("command help messages shows closest flag", () => {
  const cmd = new Command("A test command.")
    .required(string, "test", { flags: ["test"] });

  let message = "";
  try {
    cmd.parse(["--tst", "test"]);
  } catch (error) {
    message = error.message;
  }
  assertEquals(
    message,
    "Unknown flag '--tst'\n\nHELP:\n\tDid you mean --test?",
  );
});

Deno.test("can not have multiple anonymous optional arguments", () => {
  assertThrows(() =>
    new Command("A test command.").optional(string, "first").optional(
      string,
      "second",
    )
  );
});

Deno.test("can not have anonymous required argument after anonymous optional argument", () => {
  assertThrows(() =>
    new Command("A test command.").optional(string, "first").required(
      string,
      "second",
    )
  );
});

Deno.test("required arguments work as expected", () => {
  const cmd = new Command("A test command.")
    .required(string, "a")
    .required(string, "b", { flags: ["flag"] });

  assertEquals(cmd.parse(["test", "--flag", "test"]), { a: "test", b: "test" });
  assertThrows(() => cmd.parse(["test"]));
  assertThrows(() => cmd.parse(["test", "--flagg", "test"]));
  assertThrows(() => cmd.parse(["--flag", "test"]));
  assertThrows(() => cmd.parse(["too", "many", "args"]));
});

Deno.test("optional arguments work as expected", () => {
  const cmd = new Command("A test command.")
    .optional(string, "a")
    .optional(string, "b", { flags: ["flag"] });

  assertEquals(cmd.parse(["test", "--flag", "test"]), { a: "test", b: "test" });
  assertEquals(cmd.parse(["test"]), { a: "test", b: null });
  assertEquals(cmd.parse(["--flag", "test"]), { a: null, b: "test" });
  assertEquals(cmd.parse([]), { a: null, b: null });
  assertThrows(() => cmd.parse(["--flag-not-known", "test"]));
  assertThrows(() => cmd.parse(["too", "many", "args"]));
});

Deno.test("named arguments work as expected", () => {
  const cmd = new Command("A test command.")
    .required(string, "a", { flags: ["a", "long-flag", "third"] });

  assertEquals(cmd.parse(["-a", "test"]), { a: "test" });
  assertEquals(cmd.parse(["--long-flag", "test"]), { a: "test" });
  assertEquals(cmd.parse(["--third", "test"]), { a: "test" });
  assertThrows(() => cmd.parse(["--a", "test"]));
  assertThrows(() => cmd.parse(["-long-flag", "test"]));
  assertThrows(() => cmd.parse(["-third", "test"]));
  assertThrows(() => cmd.parse(["a", "test"]));
  assertThrows(() => cmd.parse(["long-flag", "test"]));
  assertThrows(() => cmd.parse(["third", "test"]));
});

Deno.test("can provide non standard number of dashes", () => {
  const cmd = new Command("A test command.")
    .optional(string, "a", { flags: ["-long-single-dash"] })
    .optional(string, "b", { flags: ["--s"] })
    .optional(string, "c", { flags: ["---three-dash"] });

  assertEquals(cmd.parse(["-long-single-dash", "test"]), {
    a: "test",
    b: null,
    c: null,
  });
  assertThrows(() => cmd.parse(["--long-single-dash", "test"]));

  assertEquals(cmd.parse(["--s", "test"]), {
    a: null,
    b: "test",
    c: null,
  });
  assertThrows(() => cmd.parse(["-s", "test"]));

  assertEquals(cmd.parse(["---three-dash", "test"]), {
    a: null,
    b: null,
    c: "test",
  });
  assertThrows(() => cmd.parse(["--three-dash", "test"]));
});

Deno.test("consecutive named arguments overwrite", () => {
  const cmd = new Command("A test command.")
    .required(string, "a", { flags: ["a", "long-flag", "third"] });

  assertEquals(cmd.parse(["-a", "one", "-a", "two"]), { a: "two" });
  assertEquals(
    cmd.parse(["-a", "one", "--third", "two", "--long-flag", "three"]),
    { a: "three" },
  );
});

Deno.test("flags work as expected", () => {
  const cmd = new Command("A test command.")
    .flag("test");

  assertEquals(cmd.parse(["--test"]), { test: true });
  assertEquals(cmd.parse(["--test", "--test"]), { test: true });
  assertEquals(cmd.parse([]), { test: false });
  assertThrows(() => cmd.parse(["--test", "test"]));
  assertThrows(() => cmd.parse(["-test"]));
  assertThrows(() => cmd.parse(["test"]));
});

Deno.test("flag aliases work", () => {
  const cmd = new Command("A test command.")
    .flag("test", { aliases: ["t", "alias"] });

  assertEquals(cmd.parse(["--test"]), { test: true });
  assertEquals(cmd.parse(["-t"]), { test: true });
  assertEquals(cmd.parse(["--alias"]), { test: true });
  assertEquals(cmd.parse(["-t", "--alias"]), { test: true });
  assertEquals(cmd.parse(["--test", "--alias"]), { test: true });
  assertEquals(cmd.parse(["-t", "--test"]), { test: true });
  assertEquals(cmd.parse(["-t", "--test", "--alias"]), { test: true });
  assertEquals(cmd.parse([]), { test: false });
  assertThrows(() => cmd.parse(["--test", "test"]));
  assertThrows(() => cmd.parse(["-test"]));
  assertThrows(() => cmd.parse(["test"]));
});

Deno.test("command help output", () => {
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

  assertEquals(
    cmd.help(["the", "given", "path"]),
    `A test command.

USAGE:
\tthe given path <first> <second> [OPTIONS]

OPTIONS:
\t-a, --age <NUMBER>                The age option.
\t-i, --index <INTEGER> (required)
\t-o, --other <STRING>              Other option.
\t--flag, -f, --a-flag              This is a flag.`,
  );

  let parseHelp = "";
  try {
    cmd.parse(["-h"]);
  } catch (error) {
    parseHelp = error.message;
  }
  assertEquals(
    parseHelp,
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
