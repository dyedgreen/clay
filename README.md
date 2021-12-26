# Clay - Deno Command Line Parser

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https://deno.land/x/clay/mod.ts)

Easily convert command line arguments to objects. Try the example:

```bash
$ deno run https://deno.land/x/clay/example.ts --help
```

## Examples

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

// `Command`s can be collected into `CommandGroup`s.
const manage = new CommandGroup("Manage imaginary resources.")
  .subcommand("create", create)
  .subcommand("destroy", destroy);

console.log(manage.run()); // { create?: {}, destroy?: { id: number, confirm: "y"|"yes"|"ok" } }
```
