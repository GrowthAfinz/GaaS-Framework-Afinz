/** Reading another section must never discard or trap an active draft. */
export function toggleStrategySection(closed: Set<string>, id: string, protectedIds: Set<string>): Set<string> {
  const next = new Set(closed);
  if (next.has(id)) next.delete(id);
  else if (!protectedIds.has(id)) next.add(id);
  return next;
}

export function collapseStrategySections(ids: string[], protectedIds: Set<string>): Set<string> {
  return new Set(ids.filter(id => !protectedIds.has(id)));
}
