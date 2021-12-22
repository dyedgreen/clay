# Clay - Deno Command Line Parser

Easily convert command line arguments to objects. Try the example:
```bash
$ deno run https://deno.land/x/clay/example.ts --help
```

## Examples

A simple command with two options, one of which is required.
```ts
import { Command, string, number } from "https://deno.land/x/clay/mod.ts";

const cmd = new Command("A simple example.")
  .required(string, "name", { flags: ["n", "name"], description: "The name." })
  .optional(number, "age", { flags: ["a", "age"], description: "The age." });

console.log(cmd.run()); // { name: string, age: number | null }
```

Simple yes / no flag options are supported as well.
```ts
import { Command, string, number } from "https://deno.land/x/clay/mod.ts";

const cmd = new Command("A simple example.")
  .required(string, "file")
  .flag("overwrite", { aliases: ["o"], description: "Overwrite the file." });

console.log(cmd.run()); // { file: string, overwrite: boolean }
```
