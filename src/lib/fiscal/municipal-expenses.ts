import type { MunicipalExpenseDelivery } from "@/lib/city-expenses/types";
import type { PersistDeliveryInput } from "./types";

export function prepareMunicipalExpenseDelivery(delivery: MunicipalExpenseDelivery): PersistDeliveryInput {
  const gastos = delivery.expenses.map((expense) => ({
    sourceId: `${delivery.recipient.key}:${expense.sourceId}`,
    recipientKey: delivery.recipient.key,
    supplierName: expense.supplierName,
    supplierDocument: publicSupplierDocument(expense.supplierDocument),
    description: expense.description,
    amount: expense.amount,
    spentAt: expense.spentAt,
    proofType: "execucao_orcamentaria" as const,
    proofStatus: "registrado" as const,
    proofAccessKey: null,
    sourceUrl: expense.sourceUrl,
    sourceLabel: expense.sourceLabel,
    coverageSource: "execucao_orcamentaria" as const,
    liquidationId: expense.liquidationId,
    paymentId: expense.paymentId,
    fieldSources: {
      supplierName: "execucao_orcamentaria" as const,
      amount: "execucao_orcamentaria" as const,
      description: "execucao_orcamentaria" as const,
      spentAt: "execucao_orcamentaria" as const,
    },
  }));

  return {
    syncSource: `municipal-${delivery.recipient.key}-execucao-orcamentaria`,
    recipientKey: delivery.recipient.key,
    recipientName: delivery.recipient.name,
    state: delivery.recipient.state,
    municipalityIbgeCode: delivery.recipient.municipalityIbgeCode,
    coverage: {
      source: "execucao_orcamentaria",
      sourceLabel: delivery.sourceLabel,
      periodStart: delivery.periodStart,
      periodEnd: delivery.periodEnd,
      knownGaps: delivery.knownGaps,
    },
    syncedAt: new Date().toISOString(),
    gastos,
    links: [],
  };
}

function publicSupplierDocument(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits.length === 14 ? digits : null;
}
