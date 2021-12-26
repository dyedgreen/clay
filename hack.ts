import { Command, integer, number, string } from "./mod.ts";

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

cmd.run();
