const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatMoney(value: number, compact = false) {
  return (compact ? compactCurrency : fullCurrency).format(value);
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}
