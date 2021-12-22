import { Command, number, string } from "./mod.ts";

const cmd = new Command("A test command.")
  .required(string, "firstName")
  .required(string, "name")
  .required(string, "city", {
    flags: ["c", "city", "town"],
    description: "Which city the person lives in.",
  })
  .optional(number, "age", {
    flags: ["a", "age"],
    description: "What age the person has.",
  });

console.log(cmd.run());
