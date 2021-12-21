import { choice } from "./mod.ts";

const oneOrTwo = choice<["one", "two"]>("NUMBER", ["one", "two"]);
