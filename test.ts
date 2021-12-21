import { Command, number, string } from "./mod.ts";
import { assertEquals } from "https://deno.land/std@0.118.0/testing/asserts.ts";

Deno.test("basic test", () => {
  let cmd = new Command("A test command.")
    .required(string, "firstName")
    .required(string, "name")
    .optional(number, "age", { flags: ["a", "age"] });

  let result = cmd.parse(["Peter", "Parker", "--age", "42"]);
  assertEquals(result, { firstName: "Peter", name: "Parker", age: 42 });
});
