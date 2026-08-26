export function sumBy<T>(rows: T[], key: (row: T) => number, value: (row: T) => number) {
  const totals = new Map<number, number>();
  for (const row of rows) totals.set(key(row), (totals.get(key(row)) ?? 0) + value(row));
  return totals;
}
