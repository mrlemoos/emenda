import type { FiscalStore, LinkKind, PublicCoverage, PublicGasto } from "./types";

export type PublicGastoFilters = {
  amendmentCode?: string;
  recipientKey?: string;
  supplierName?: string;
  from?: string;
  to?: string;
};

export function getPublicGastos(store: FiscalStore, filters: PublicGastoFilters = {}): PublicGasto[] {
  const links = store.listLinks();
  const linkByGasto = new Map(links.map((link) => [link.gastoSourceId, link]));

  return store
    .listGastos()
    .filter((gasto) => {
      if (filters.recipientKey && gasto.recipientKey !== filters.recipientKey) return false;
      if (filters.supplierName && !gasto.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase())) {
        return false;
      }
      if (filters.from && gasto.spentAt < filters.from) return false;
      if (filters.to && gasto.spentAt > filters.to) return false;
      if (filters.amendmentCode) {
        const link = linkByGasto.get(gasto.sourceId);
        if (!link || link.amendmentCode !== filters.amendmentCode) return false;
      }
      return true;
    })
    .map((gasto) => {
      const link = linkByGasto.get(gasto.sourceId);
      return {
        id: gasto.sourceId,
        supplierName: gasto.supplierName,
        supplierDocument: gasto.supplierDocument,
        description: gasto.description,
        spentAt: gasto.spentAt,
        amount: gasto.amount,
        proofType: gasto.proofType,
        proofStatus: gasto.proofStatus,
        proofAccessKey: gasto.proofAccessKey,
        sourceUrl: gasto.sourceUrl,
        sourceLabel: gasto.sourceLabel,
        liquidationId: gasto.liquidationId,
        paymentId: gasto.paymentId,
        fieldSources: gasto.fieldSources,
        link: link
          ? {
              kind: link.kind,
              amendmentCode: link.amendmentCode,
              reasons: link.reasons,
            }
          : null,
      } satisfies PublicGasto;
    });
}

export function getPublicCoverage(store: FiscalStore, recipientKey: string): PublicCoverage | null {
  return store.getCoverage(recipientKey);
}

export function publicGastosCsv(gastos: PublicGasto[]): string {
  const columns = [
    "id",
    "emenda",
    "fornecedor",
    "documento_fornecedor",
    "descricao",
    "data",
    "valor",
    "tipo_comprovacao",
    "estado_comprovacao",
    "chave",
    "vinculo",
    "motivos",
    "fonte",
    "liquidacao",
    "pagamento",
  ] as const;

  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const linkLabel = (kind: LinkKind | undefined) =>
    kind === "confirmed" ? "confirmado" : kind === "probable" ? "provavel" : "";

  const rows = gastos.map((gasto) => ({
    id: gasto.id,
    emenda: gasto.link?.amendmentCode ?? "",
    fornecedor: gasto.supplierName,
    documento_fornecedor: gasto.supplierDocument ?? "",
    descricao: gasto.description ?? "",
    data: gasto.spentAt ?? "",
    valor: gasto.amount,
    tipo_comprovacao: gasto.proofType,
    estado_comprovacao: gasto.proofStatus,
    chave: gasto.proofAccessKey ?? "",
    vinculo: linkLabel(gasto.link?.kind),
    motivos: gasto.link?.reasons.join("; ") ?? "",
    fonte: gasto.sourceUrl ?? gasto.sourceLabel,
    liquidacao: gasto.liquidationId ?? "",
    pagamento: gasto.paymentId ?? "",
  }));

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(",")),
  ].join("\n");
}
