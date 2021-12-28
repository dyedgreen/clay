# Clay - Deno Command Line Argument Parsing

[![tests](https://github.com/dyedgreen/clay/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/dyedgreen/clay/actions/workflows/tests.yml)
[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https://deno.land/x/clay/mod.ts)

Easily convert command line arguments to objects. Try the example:

```bash
$ deno run https://deno.land/x/clay/example.ts --help
```

## Features

- Type-safe, extensible argument parsing
- Support for named arguments (passed as `--flags`) and positional arguments
- Automatically generated help messages (accessible with `-h` or `--help`)
- Automatically generated error messages, including suggestions for misspelled
  arguments

## Code Examples

A simple command with two options, one of which is required.

```ts
import { Command, number, string } from "https://deno.land/x/clay/mod.ts";

const cmd = new Command("A simple example.")
  .required(string, "name", { flags: ["n", "name"], description: "The name." })
  .optional(number, "age", { flags: ["a", "age"], description: "The age." });

console.log(cmd.run()); // { name: string, age: number | null }
```

Anonymous (positional) arguments, as well as simple yes / no flag options are
supported as well.

```ts
import { Command, string } from "https://deno.land/x/clay/mod.ts";

const cmd = new Command("Example with anonymous arguments and flags.")
  .required(string, "file")
  .flag("overwrite", { aliases: ["o"], description: "Overwrite the file." });

console.log(cmd.run()); // { file: string, overwrite: boolean }
```

A command group can contain multiple sub-commands. Notice that empty commands
are also possible.

```ts
import {
  choice,
  Command,
  CommandGroup,
  integer,
} from "https://deno.land/x/clay/mod.ts";

const create = new Command("Create a new resource.");
const destroy = new Command("Destroy a given resource.")
  .required(integer, "id")
  .required(choice("CONFIRM", ["y", "yes", "ok"]), "confirm", {
    flags: ["confirm"],
    description: "Confirm this action.",
  });

const manage = new CommandGroup("Manage imaginary resources.")
  .subcommand("create", create)
  .subcommand("destroy", destroy);

console.log(manage.run()); // { create?: {}, destroy?: { id: number, confirm: "y"|"yes"|"ok" } }
```

Defining new parsers for custom types is also possible.

```ts
type email = string;

const email = {
  parse: (raw: string): email => {
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
const cmd = new Command("Example with a custom type.")
  .required(email, "email");

console.log(cmd.run()); // { email: email }
```
