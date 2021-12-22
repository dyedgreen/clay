import {
  choice,
  Command,
  CommandGroup,
  integer,
  number,
  string,
} from "./mod.ts";

// Create a command with a few options
const person = new Command("Describe a person.")
  .required(string, "name")
  .required(number, "age", {
    flags: ["a", "age"],
    description: "The persons age in years.",
  })
  .flag("dead", { description: "Whether this person is dead." });

// Create another command. Notice that you can only accept a set of predetermined
// values using `choice`.
const device = new Command("Input your device details.")
  .required(choice("DEVICE_TYPE", ["phone", "laptop", "desktop"]), "type")
  .required(integer, "serialNumber", {
    flags: ["s", "serial", "serial-number"],
    description: "The devices serial number.",
  })
  .optional(string, "friendlyName", {
    flags: ["n", "name", "friendly-name"],
    description: "A friendly name for the device.",
  })
  .flag("lost", { description: "Whether this device was lost." });

// If you need an argument that can not be parsed using one of the predefined
// types, you can build your own argument types.
const email = {
  parse: (raw: string): string => {
    if (/^[a-z0-9-_.]+@[a-z0-9-_.]+$/i.test(raw)) {
      return raw;
    } else {
      throw new Error(
        `'${raw.replaceAll("'", "\\'")}' is not a recognized email address`,
      );
    }
  },
  typeName: "EMAIL",
};
const signup = new Command("Register for an imaginary account.")
  .required(string, "name", { flags: ["name"], description: "Your name." })
  .required(email, "email", {
    flags: ["email"],
    description: "Your email address.",
  });

// A pair of very simple commands. Notice that a command does not need
// to specify any options.
const create = new Command("Create a new resource.");
const destroy = new Command("Destroy a given resource.")
  .required(string, "resource")
  .required(choice("CONFIRM", ["y", "yes", "ok"]), "confirm", {
    flags: ["confirm"],
    description: "Confirm this action.",
  });

// `Command`s can be collected into `CommandGroup`s.
const manage = new CommandGroup("Manage imaginary resources.")
  .subcommand("create", create)
  .subcommand("destroy", destroy);

// `CommandGroup`s can contain other groups, as well as
// commands.
const allCommands = new CommandGroup(
  "Clay (https://deno.land/x/clay) example command.",
)
  .subcommand("person", person)
  .subcommand("device", device)
  .subcommand("signup", signup)
  .subcommand("manage", manage);

// Just print the parsed CLI input
console.log(allCommands.run());
