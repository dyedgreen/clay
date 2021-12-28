import { boolean, choice, date, integer, number, string } from "./types.ts";
import {
  assert,
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
    "Infinity",
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

Deno.test("date type", () => {
  const dateUTC = (
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
  ): Date => {
    const date = new Date();
    date.setUTCFullYear(year);
    date.setUTCMonth(month - 1);
    date.setUTCDate(day);
    date.setUTCHours(hours);
    date.setUTCMinutes(minutes);
    date.setUTCSeconds(seconds);
    date.setUTCMilliseconds(0);
    return date;
  };
  const dateLocal = (
    year: number,
    month: number,
    day: number,
    hours: number,
    minutes: number,
    seconds: number,
  ): Date => {
    const date = new Date();
    date.setFullYear(year);
    date.setMonth(month - 1);
    date.setDate(day);
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(seconds);
    date.setMilliseconds(0);
    return date;
  };
  const good: [string, Date][] = [
    [
      "today",
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
      ),
    ],
    ["1999-11-20T12:00:00Z", dateUTC(1999, 11, 20, 12, 0, 0)],
    ["2021/12/24", dateLocal(2021, 12, 24, 0, 0, 0)],
    ["2021.12.24", dateLocal(2021, 12, 24, 0, 0, 0)],
    ["2021-12-24", dateLocal(2021, 12, 24, 0, 0, 0)],
    ["2006-1-9", dateLocal(2006, 1, 9, 0, 0, 0)],
    ["17:32:11 2006-1-9", dateLocal(2006, 1, 9, 17, 32, 11)],
    ["2006/1/9 17:32", dateLocal(2006, 1, 9, 17, 32, 0)],
    ["17:32:11   2006-1-9", dateLocal(2006, 1, 9, 17, 32, 11)],
    ["2012-8-16 6:19", dateLocal(2012, 8, 16, 6, 19, 0)],
  ];
  const bad = [
    "wfwe",
    "",
    "   ",
    "1992/13/09",
    "18:46",
    "2021/11/11 25:11:52",
    "2021/11/11 6:60:52",
  ];

  // Don't directly compare, since the exact time can change
  // slightly between the two creations.
  const now = date.parse("now");
  assert(
    Math.abs(now.valueOf() - Date.now()) < 0.01,
    "now should return current time",
  );

  for (const [raw, value] of lowerAndUpperCase(addPadding(good))) {
    assertEquals(date.parse(raw), value);
  }
  for (const raw of bad) assertThrows(() => date.parse(raw));
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
