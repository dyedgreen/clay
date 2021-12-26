import { boolean, choice, integer, number, string } from "./types.ts";
import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.118.0/testing/asserts.ts";

const addPadding = <T>(pairs: [string, T][]): [string, T][] =>
  pairs.flatMap(([raw, value]) => [
    [raw, value],
    [" " + raw, value],
    ["   " + raw, value],
    [raw + " ", value],
    [raw + "   ", value],
    [" " + raw + " ", value],
    ["  " + raw + "   ", value],
  ]);

const lowerAndUpperCase = <T>(pairs: [string, T][]): [string, T][] =>
  pairs.flatMap(([raw, value]) => [
    [raw, value],
    [raw.toLowerCase(), value],
    [raw.toUpperCase(), value],
  ]);

Deno.test("string type", () => {
  const strings = ["hello", "hello world", "deno", "clay", "42"];
  for (const raw of strings) assertEquals(string.parse(raw), raw);
});

Deno.test("number type", () => {
  const good: [string, number][] = [
    ["1", 1],
    ["2435", 2435],
    ["345.6", 345.6],
    ["1e4", 10000],
    ["1e-6", 0.000001],
    ["234.45e10", 234.45e10],
    ["-23", -23],
    ["-42.1", -42.1],
    ["+35.4", 35.4],
    ["-23e24", -23e24],
    ["234.234e-4", 234.234e-4],
    ["0.0", 0],
    ["0", 0],
    ["-0", -0],
    ["0x353", 0x353],
  ];
  const bad = [
    "test 34 bad",
    "five",
    "",
    "   ",
    "4+6",
    "345f",
    "  345345.34w  ",
  ];

  for (const [raw, value] of lowerAndUpperCase(addPadding(good))) {
    assertEquals(number.parse(raw), value);
  }
  for (const raw of bad) assertThrows(() => number.parse(raw));
});

Deno.test("integer type", () => {
  const good: [string, number][] = [
    ["1", 1],
    ["2435", 2435],
    ["345", 345],
    ["0", 0],
    ["-0", 0],
    ["+23235", 23235],
    ["-24", -24],
  ];
  const bad = [
    "test 34 bad",
    "five",
    "",
    "   ",
    "4+6",
    "345f",
    "  345345.34w  ",
    "234.235",
    "3234e-5",
    "-234234.2",
  ];

  for (const [raw, value] of lowerAndUpperCase(addPadding(good))) {
    assertEquals(integer.parse(raw), value);
  }
  for (const raw of bad) assertThrows(() => integer.parse(raw));
});

Deno.test("boolean type", () => {
  const good: [string, boolean][] = [
    ["true", true],
    ["True", true],
    ["yes", true],
    ["Yes", true],
    ["y", true],
    ["1", true],
    ["false", false],
    ["False", false],
    ["no", false],
    ["No", false],
    ["n", false],
    ["0", false],
  ];
  const bad = ["f alse", "maybe", "", "   ", "sdnfoiewnf", "42"];

  for (const [raw, value] of lowerAndUpperCase(addPadding(good))) {
    assertEquals(boolean.parse(raw), value);
  }
  for (const raw of bad) assertThrows(() => boolean.parse(raw));
});

Deno.test("choice type", () => {
  const choices = ["a", "b", "c", "test", "Hello", "World"];
  const alsoChoices: [string, string][] = [
    ["Test", "test"],
    [" a ", "a"],
    [" c", "c"],
    [" HELLO ", "Hello"],
    ["world   ", "World"],
    ["A", "a"],
  ];
  const nonChoices = [
    "d",
    "TEeST",
    "Tesst",
    "hello world",
    "ab",
    " Word",
    "a  _",
    ".  a  ",
  ];
  const type = choice("TEST TYPE", choices);
  for (const choice of choices) assertEquals(type.parse(choice), choice);
  for (const [raw, value] of lowerAndUpperCase(addPadding(alsoChoices))) {
    assertEquals(type.parse(raw), value);
  }
  for (const raw of nonChoices) assertThrows(() => type.parse(raw));
});
