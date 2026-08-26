import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  amendments,
  expenseLinks,
  expenses,
  fiscalCoverages,
  recipients,
  sourceCursors,
  syncRuns,
} from "@/db/schema";
import { ingestAuthorizedDelivery } from "./ingest";
import { createMemoryFiscalStore } from "./memory-store";
import type {
  AuthorizedFiscalDelivery,
  FiscalStore,
  IngestResult,
  PersistDeliveryInput,
  PublicCoverage,
  PublicGasto,
  StoredLink,
} from "./types";

export async function getSourceCursor(source: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db.select().from(sourceCursors).where(eq(sourceCursors.source, source)).limit(1);
  return row?.lastNsu ?? null;
}

export async function loadCoverageFromDb(recipientKey: string): Promise<PublicCoverage | null> {
  const db = getDb();
  const rows = await db.select().from(fiscalCoverages).where(eq(fiscalCoverages.recipientKey, recipientKey));
  if (!rows.length) return null;
  return {
    recipientKey,
    recipientName: rows[0].recipientName,
    sources: rows.map((row) => ({
      source: row.source,
      sourceLabel: row.sourceLabel,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      lastSyncedAt: row.lastSyncedAt.toISOString(),
      knownGaps: row.knownGaps,
    })),
  };
}

export async function loadPublicGastosFromDb(filters: {
  amendmentCode?: string;
  recipientKey?: string;
  supplierName?: string;
  from?: string;
  to?: string;
} = {}): Promise<PublicGasto[]> {
  const db = getDb();
  const rows = await db
    .select({
      expense: expenses,
      kind: expenseLinks.kind,
      reasons: expenseLinks.reasons,
      amendmentCode: amendments.code,
    })
    .from(expenses)
    .leftJoin(expenseLinks, eq(expenseLinks.expenseId, expenses.id))
    .leftJoin(amendments, eq(expenseLinks.amendmentId, amendments.id));

  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (filters.recipientKey && row.expense.recipientKey !== filters.recipientKey) return false;
      if (
        filters.supplierName &&
        !row.expense.supplierName.toLowerCase().includes(filters.supplierName.toLowerCase())
      ) {
        return false;
      }
      if (filters.from && (row.expense.spentAt ?? "") < filters.from) return false;
      if (filters.to && (row.expense.spentAt ?? "") > filters.to) return false;
      if (filters.amendmentCode && row.amendmentCode !== filters.amendmentCode) return false;
      if (seen.has(row.expense.sourceId)) return false;
      seen.add(row.expense.sourceId);
      return true;
    })
    .map((row) => ({
      id: row.expense.sourceId,
      supplierName: row.expense.supplierName,
      supplierDocument: row.expense.supplierDocument,
      description: row.expense.description,
      spentAt: row.expense.spentAt,
      amount: String(row.expense.amount),
      proofType: row.expense.proofType ?? "nfe",
      proofStatus: row.expense.proofStatus ?? "autorizada",
      proofAccessKey: row.expense.invoiceKey,
      sourceUrl: row.expense.sourceUrl,
      sourceLabel: row.expense.proofSourceLabel ?? "",
      liquidationId: row.expense.liquidationId,
      paymentId: row.expense.paymentId,
      fieldSources: {
        supplierName: "nota" as const,
        amount: "nota" as const,
        description: "nota" as const,
        spentAt: "nota" as const,
      },
      link:
        row.kind && row.amendmentCode
          ? { kind: row.kind, amendmentCode: row.amendmentCode, reasons: row.reasons ?? [] }
          : null,
    }));
}

export async function ingestAuthorizedDeliveryToDb(
  delivery: AuthorizedFiscalDelivery,
): Promise<IngestResult> {
  const existingLinks = await loadLinksFromDb();
  const memory = createMemoryFiscalStore();
  const store: FiscalStore = {
    seedAmendment: memory.seedAmendment.bind(memory),
    failNextPersist: memory.failNextPersist.bind(memory),
    getCursor: memory.getCursor.bind(memory),
    listGastos: memory.listGastos.bind(memory),
    getCoverage: memory.getCoverage.bind(memory),
    listLinks() {
      const current = memory.listLinks();
      const claimed = new Set(current.map((link) => link.gastoSourceId));
      return [...current, ...existingLinks.filter((link) => !claimed.has(link.gastoSourceId))];
    },
    async persistDelivery(input) {
      await persistDeliveryToDb(input);
    },
  };
  return ingestAuthorizedDelivery(delivery, store);
}

async function loadLinksFromDb(): Promise<StoredLink[]> {
  const db = getDb();
  const rows = await db
    .select({
      gastoSourceId: expenses.sourceId,
      amendmentCode: amendments.code,
      kind: expenseLinks.kind,
      reasons: expenseLinks.reasons,
      previousReasons: expenseLinks.previousReasons,
    })
    .from(expenseLinks)
    .innerJoin(expenses, eq(expenseLinks.expenseId, expenses.id))
    .innerJoin(amendments, eq(expenseLinks.amendmentId, amendments.id));

  return rows.map((row) => ({
    gastoSourceId: row.gastoSourceId,
    amendmentCode: row.amendmentCode,
    kind: row.kind,
    reasons: row.reasons,
    previousReasons: row.previousReasons,
  }));
}

async function persistDeliveryToDb(input: PersistDeliveryInput) {
  const db = getDb();
  const [run] = await db.insert(syncRuns).values({ source: `fiscal-${input.coverage.source}` }).returning();
  const syncedAt = new Date(input.syncedAt);

  try {
    const recipientId = await ensureRecipient(
      input.recipientKey,
      input.recipientName,
      input.authorizedTakerDocuments ?? [],
    );

    for (const gasto of input.gastos) {
      await db
        .insert(expenses)
        .values({
          sourceId: gasto.sourceId,
          recipientId,
          recipientKey: gasto.recipientKey,
          supplierName: gasto.supplierName,
          supplierDocument: gasto.supplierDocument,
          description: gasto.description,
          amount: gasto.amount,
          spentAt: gasto.spentAt,
          invoiceKey: gasto.proofAccessKey,
          proofType: gasto.proofType,
          proofStatus: gasto.proofStatus,
          proofSourceLabel: gasto.sourceLabel,
          proofUpdatedAt: syncedAt,
          liquidationId: gasto.liquidationId,
          paymentId: gasto.paymentId,
          sourceUrl: gasto.sourceUrl ?? `https://emenda.local/fiscal/${gasto.sourceId}`,
        })
        .onConflictDoUpdate({
          target: expenses.sourceId,
          set: {
            recipientId,
            recipientKey: gasto.recipientKey,
            supplierName: sql`excluded.supplier_name`,
            supplierDocument: sql`excluded.supplier_document`,
            description: sql`excluded.description`,
            amount: sql`excluded.amount`,
            spentAt: sql`excluded.spent_at`,
            invoiceKey: sql`excluded.invoice_key`,
            proofType: sql`excluded.proof_type`,
            proofStatus: sql`excluded.proof_status`,
            proofSourceLabel: sql`excluded.proof_source_label`,
            proofUpdatedAt: syncedAt,
            liquidationId: sql`excluded.liquidation_id`,
            paymentId: sql`excluded.payment_id`,
            sourceUrl: sql`excluded.source_url`,
          },
        });
    }

    const expenseRows = await db.select({ id: expenses.id, sourceId: expenses.sourceId }).from(expenses);
    const expenseIds = new Map(expenseRows.map((row) => [row.sourceId, row.id]));
    const amendmentRows = await db.select({ id: amendments.id, code: amendments.code }).from(amendments);
    const amendmentIds = new Map(amendmentRows.map((row) => [row.code, row.id]));

    for (const link of input.links) {
      const expenseId = expenseIds.get(link.gastoSourceId);
      const amendmentId = amendmentIds.get(link.amendmentCode);
      if (!expenseId || !amendmentId) continue;
      await db
        .insert(expenseLinks)
        .values({
          amendmentId,
          expenseId,
          kind: link.kind,
          reasons: link.reasons,
          previousReasons: link.previousReasons,
          updatedAt: syncedAt,
        })
        .onConflictDoUpdate({
          target: [expenseLinks.amendmentId, expenseLinks.expenseId],
          set: {
            kind: sql`excluded.kind`,
            reasons: sql`excluded.reasons`,
            previousReasons: sql`excluded.previous_reasons`,
            updatedAt: syncedAt,
          },
        });
    }

    await db
      .insert(fiscalCoverages)
      .values({
        recipientKey: input.recipientKey,
        recipientName: input.recipientName,
        recipientId,
        source: input.coverage.source,
        sourceLabel: input.coverage.sourceLabel,
        periodStart: input.coverage.periodStart,
        periodEnd: input.coverage.periodEnd,
        knownGaps: input.coverage.knownGaps,
        lastSyncedAt: syncedAt,
      })
      .onConflictDoUpdate({
        target: [fiscalCoverages.recipientKey, fiscalCoverages.source],
        set: {
          recipientName: sql`excluded.recipient_name`,
          recipientId,
          sourceLabel: sql`excluded.source_label`,
          periodStart: sql`excluded.period_start`,
          periodEnd: sql`excluded.period_end`,
          knownGaps: sql`excluded.known_gaps`,
          lastSyncedAt: syncedAt,
        },
      });

    if (input.cursor) {
      await db
        .insert(sourceCursors)
        .values({
          source: input.cursor.source,
          lastNsu: input.cursor.lastNsu,
          updatedAt: syncedAt,
        })
        .onConflictDoUpdate({
          target: sourceCursors.source,
          set: { lastNsu: sql`excluded.last_nsu`, updatedAt: syncedAt },
        });
    }

    await db
      .update(syncRuns)
      .set({
        status: "complete",
        finishedAt: new Date(),
        sourceUpdatedAt: syncedAt,
        rowsProcessed: input.gastos.length,
      })
      .where(eq(syncRuns.id, run.id));
  } catch (error) {
    await db
      .update(syncRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(syncRuns.id, run.id));
    throw error;
  }
}

async function ensureRecipient(
  recipientKey: string,
  recipientName: string,
  authorizedTakerDocuments: string[] = [],
) {
  const db = getDb();
  const [byKey] = await db.select().from(recipients).where(eq(recipients.fiscalKey, recipientKey)).limit(1);
  if (byKey) return byKey.id;

  for (const document of authorizedTakerDocuments) {
    const digits = document.replace(/\D/g, "");
    if (!digits) continue;
    const [byCnpj] = await db.select().from(recipients).where(eq(recipients.cnpj, digits)).limit(1);
    if (byCnpj) {
      await db
        .update(recipients)
        .set({ fiscalKey: recipientKey, updatedAt: new Date() })
        .where(eq(recipients.id, byCnpj.id));
      return byCnpj.id;
    }
  }

  const [byName] = await db.select().from(recipients).where(eq(recipients.name, recipientName)).limit(1);
  if (byName) {
    await db
      .update(recipients)
      .set({ fiscalKey: recipientKey, updatedAt: new Date() })
      .where(eq(recipients.id, byName.id));
    return byName.id;
  }

  const [created] = await db
    .insert(recipients)
    .values({
      sourceId: fiscalSourceId(recipientKey),
      name: recipientName,
      cnpj: authorizedTakerDocuments[0]?.replace(/\D/g, "") || null,
      kind: "municipality",
      state: "SC",
      municipalityName: recipientName,
      fiscalKey: recipientKey,
    })
    .returning();
  return created.id;
}

function fiscalSourceId(recipientKey: string) {
  let hash = 0;
  for (const char of recipientKey) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return -Math.abs(hash || 1);
}
