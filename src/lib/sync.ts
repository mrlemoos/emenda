import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { amendments, payments, recipients, sourceCommitments, syncRuns } from "@/db/schema";
import {
  fetchTable,
  sourceUpdatedAt,
  transferegovSourceUrl,
  type ActionPlan,
  type Beneficiary,
  type Commitment,
  type EligibleDocument,
  type PaymentOrder,
} from "@/lib/transferegov";

export type SyncStage = "beneficiarios" | "emendas" | "empenhos" | "pagamentos";

const chunk = <T>(rows: T[], size = 500) =>
  Array.from({ length: Math.ceil(rows.length / size) }, (_, index) => rows.slice(index * size, (index + 1) * size));

async function syncBeneficiaries() {
  const db = getDb();
  const rows = await fetchTable<Beneficiary>("beneficiarios_especiais");
  for (const batch of chunk(rows)) {
    await db.insert(recipients).values(batch.map((row) => ({
      sourceId: row.id_beneficiario,
      name: row.nome_beneficiario,
      cnpj: row.cnpj_beneficiario,
      state: row.uf_beneficiario,
      kind: row.id_ente ? ("municipality" as const) : ("institution" as const),
      municipalityIbgeCode: row.id_ente ? String(row.id_ente) : null,
      municipalityName: row.id_ente ? row.nome_beneficiario : null,
    }))).onConflictDoUpdate({ target: recipients.sourceId, set: { name: sql`excluded.name`, cnpj: sql`excluded.cnpj`, state: sql`excluded.state`, updatedAt: new Date() } });
  }
  return rows.length;
}

async function syncAmendments(updatedAt: Date) {
  const db = getDb();
  const plans = await fetchTable<ActionPlan>("planos_acao_especiais");
  const recipientRows = await db.select({ id: recipients.id, sourceId: recipients.sourceId }).from(recipients);
  const recipientIds = new Map(recipientRows.map((row) => [row.sourceId, row.id]));
  for (const batch of chunk(plans)) {
    const values = batch.flatMap((row) => {
      const recipientId = recipientIds.get(row.id_beneficiario);
      if (!recipientId) return [];
      return [{ sourceId: row.id_plano_acao, recipientId, code: row.codigo_emenda_parlamentar_formatado_plano_acao, year: row.ano_emenda_parlamentar_plano_acao, authorName: row.nome_parlamentar_emenda_plano_acao, authorCode: row.codigo_parlamentar_emenda_plano_acao, purpose: row.detalhamento_objeto ?? row.nome_objeto, status: row.situacao_plano_acao, authorisedAmount: String(Number(row.valor_custeio_plano_acao ?? 0) + Number(row.valor_investimento_plano_acao ?? 0)), sourceUrl: transferegovSourceUrl, sourceUpdatedAt: updatedAt }];
    });
    if (values.length) await db.insert(amendments).values(values).onConflictDoUpdate({ target: amendments.sourceId, set: { recipientId: sql`excluded.recipient_id`, purpose: sql`excluded.purpose`, status: sql`excluded.status`, authorisedAmount: sql`excluded.authorised_amount`, sourceUpdatedAt: updatedAt, updatedAt: new Date() } });
  }
  return plans.length;
}

async function syncCommitments() {
  const db = getDb();
  const rows = await fetchTable<Commitment>("empenhos_especiais");
  const amendmentRows = await db.select({ id: amendments.id, sourceId: amendments.sourceId }).from(amendments);
  const amendmentIds = new Map(amendmentRows.map((row) => [row.sourceId, row.id]));
  for (const batch of chunk(rows)) {
    const values = batch.flatMap((row) => {
      const amendmentId = amendmentIds.get(row.id_plano_acao);
      return amendmentId ? [{ sourceId: row.id_empenho, amendmentId, amount: String(row.valor_empenho) }] : [];
    });
    if (values.length) await db.insert(sourceCommitments).values(values).onConflictDoUpdate({ target: sourceCommitments.sourceId, set: { amendmentId: sql`excluded.amendment_id`, amount: sql`excluded.amount` } });
  }
  await db.update(amendments).set({ committedAmount: "0" });
  await db.execute(sql`update amendments a set committed_amount = c.total, updated_at = now() from (select amendment_id, sum(amount) total from source_commitments group by amendment_id) c where a.id = c.amendment_id`);
  return rows.length;
}

async function syncPayments() {
  const db = getDb();
  const documents = await fetchTable<EligibleDocument>("documentos_habeis_especiais");
  const orders = await fetchTable<PaymentOrder>("ordens_pagamentos_ordens_bancarias_especiais");
  const commitmentRows = await db.select().from(sourceCommitments);
  const commitmentAmendments = new Map(commitmentRows.map((row) => [row.sourceId, row.amendmentId]));
  const documentData = new Map(documents.map((row) => [row.id_dh, row]));
  const values = orders.flatMap((order) => {
    const document = documentData.get(order.id_dh);
    const amendmentId = document ? commitmentAmendments.get(document.id_empenho) : undefined;
    if (!document || !amendmentId || !order.data_emissao_ob) return [];
    return [{ sourceId: String(order.id_op_ob), amendmentId, amount: String(document.valor_dh), paidAt: order.data_emissao_ob, documentNumber: order.numero_ordem_bancaria ?? document.numero_documento_habil, sourceUrl: transferegovSourceUrl }];
  });
  for (const batch of chunk(values)) await db.insert(payments).values(batch).onConflictDoUpdate({ target: payments.sourceId, set: { amount: sql`excluded.amount`, paidAt: sql`excluded.paid_at`, documentNumber: sql`excluded.document_number` } });
  await db.update(amendments).set({ paidAmount: "0" });
  await db.execute(sql`update amendments a set paid_amount = p.total, updated_at = now() from (select amendment_id, sum(amount) total from payments group by amendment_id) p where a.id = p.amendment_id`);
  return documents.length + orders.length;
}

export async function syncTransferegov(stage: SyncStage) {
  const db = getDb();
  const source = `transferegov-${stage}`;
  const [run] = await db.insert(syncRuns).values({ source }).returning();
  try {
    const updatedAt = await sourceUpdatedAt();
    const rowsProcessed = stage === "beneficiarios" ? await syncBeneficiaries() : stage === "emendas" ? await syncAmendments(updatedAt) : stage === "empenhos" ? await syncCommitments() : await syncPayments();
    await db.update(syncRuns).set({ status: "complete", finishedAt: new Date(), sourceUpdatedAt: updatedAt, rowsProcessed }).where(eq(syncRuns.id, run.id));
    return { stage, rowsProcessed };
  } catch (error) {
    await db.update(syncRuns).set({ status: "failed", finishedAt: new Date(), error: error instanceof Error ? error.message : String(error) }).where(eq(syncRuns.id, run.id));
    throw error;
  }
}
