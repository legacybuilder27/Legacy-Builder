export function reorderQuestions<T extends { id: string; sortOrder: number }>(
  items: T[],
  id: string,
  direction: "up" | "down",
): T[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = sorted.findIndex((item) => item.id === id);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapWith < 0 || swapWith >= sorted.length) {
    return sorted.map((item, order) => ({ ...item, sortOrder: order }));
  }
  const next = [...sorted];
  const current = next[index];
  next[index] = next[swapWith];
  next[swapWith] = current;
  return next.map((item, order) => ({ ...item, sortOrder: order }));
}
