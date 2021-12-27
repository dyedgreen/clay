function intersection<T>(a: Set<T>, b: Set<T>): number {
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection;
}

function union<T>(a: Set<T>, b: Set<T>): number {
  let union = a.size;
  for (const item of b) if (!a.has(item)) union += 1;
  return union;
}

export function closest(
  string: string,
  options: Iterable<string>,
): string | null {
  const stringSet = new Set(string);
  let bestItem = null;
  let bestScore = 0;
  for (const item of options) {
    const itemSet = new Set(item);
    const score = intersection(stringSet, itemSet) / union(stringSet, itemSet);
    if (bestScore <= score) {
      bestScore = score;
      bestItem = item;
    }
  }
  return bestItem;
}
