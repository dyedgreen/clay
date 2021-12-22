import { choice, Command, CommandGroup, number, string } from "./mod.ts";

const cmd = new Command("A test command.")
  .required(string, "firstName")
  .required(string, "name")
  .optional(number, "age", { flags: ["a", "age"] });

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
  .subcommand("second", secondCmd)
  .subcommand("other", cmd);

const superGroup = new CommandGroup("A super group.")
  .subcommand("sub-group", group)
  .subcommand("first", firstCmd);

console.log(superGroup.run());
