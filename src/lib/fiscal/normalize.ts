import type { FiscalDocumentInput, NormalizedGasto } from "./types";

/** Maps a fiscal document to public fields. CPF, address, phone, email and rawXml are never copied. */
export function normalizeDocument(
  document: FiscalDocumentInput,
  context: { recipientKey: string; sourceLabel: string; coverageSource: NormalizedGasto["coverageSource"] },
): NormalizedGasto {
  return {
    sourceId: document.sourceId,
    recipientKey: context.recipientKey,
    supplierName: document.supplierName,
    supplierDocument: document.supplierDocument ?? null,
    description: document.description ?? null,
    amount: document.amount,
    spentAt: document.issuedAt,
    proofType: document.proofType,
    proofStatus: document.status,
    proofAccessKey: document.accessKey ?? null,
    sourceUrl: document.sourceUrl ?? null,
    sourceLabel: context.sourceLabel,
    coverageSource: context.coverageSource,
    liquidationId: document.liquidationId ?? null,
    paymentId: document.paymentId ?? null,
    fieldSources: {
      supplierName: "nota",
      amount: "nota",
      description: "nota",
      spentAt: "nota",
    },
  };
}
