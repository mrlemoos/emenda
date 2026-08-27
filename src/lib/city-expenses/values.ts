export type CkanRow = Record<string, unknown>;

export function field(row: CkanRow, ...names: string[]) {
  const entries = new Map(Object.entries(row).map(([key, value]) => [keyOf(key), value]));
  for (const name of names) {
    const value = entries.get(keyOf(name));
    if (value !== undefined) return value;
  }
  return null;
}

export function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result || null;
}

export function money(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const decimal = cleaned.includes(",") ? cleaned.replaceAll(".", "").replace(",", ".") : cleaned;
  const amount = Number(decimal);
  return Number.isFinite(amount) ? amount.toFixed(2) : null;
}

export function date(value: unknown): string | null {
  const raw = text(value);
  if (!raw) return null;
  const brazilian = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  if (brazilian) return `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}`;
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return iso?.[1] ?? null;
}

export function cnpj(value: unknown): string | null {
  const digits = text(value)?.replace(/\D/g, "") ?? "";
  return digits.length === 14 ? digits : null;
}

function keyOf(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}
