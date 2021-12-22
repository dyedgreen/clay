export function leftPad(string: string, length: number): string {
  const pad = new Array(Math.max(0, length - string.length)).fill(" ");
  return string + pad.join("");
}
