import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  amendments,
  expenseLinks,
  expenses,
  fiscalCoverages,
  payments,
  recipients,
  syncRuns,
} from "@/db/schema";

export async function getOverview() {
  const db = getDb();
  const [[totals], states, municipalities, authors, recent, [lastSync]] = await Promise.all([
    db
      .select({
        paid: sql<number>`coalesce(sum(${amendments.paidAmount}), 0)::float`,
        amendments: sql<number>`count(*)::int`,
        recipients: sql<number>`count(distinct ${amendments.recipientId})::int`,
      })
      .from(amendments),
    db
      .select({ state: recipients.state, paid: sql<number>`sum(${amendments.paidAmount})::float` })
      .from(amendments)
      .innerJoin(recipients, eq(amendments.recipientId, recipients.id))
      .groupBy(recipients.state),
    db
      .select({
        id: recipients.id,
        name: recipients.name,
        state: recipients.state,
        paid: sql<number>`sum(${amendments.paidAmount})::float`,
      })
      .from(amendments)
      .innerJoin(recipients, eq(amendments.recipientId, recipients.id))
      .groupBy(recipients.id)
      .orderBy(desc(sql`sum(${amendments.paidAmount})`))
      .limit(6),
    db
      .select({ name: amendments.authorName, paid: sql<number>`sum(${amendments.paidAmount})::float` })
      .from(amendments)
      .groupBy(amendments.authorName)
      .orderBy(desc(sql`sum(${amendments.paidAmount})`))
      .limit(6),
    db
      .select({
        id: amendments.id,
        code: amendments.code,
        year: amendments.year,
        authorName: amendments.authorName,
        purpose: amendments.purpose,
        paid: sql<number>`${amendments.paidAmount}::float`,
        recipient: recipients.name,
        state: recipients.state,
      })
      .from(amendments)
      .innerJoin(recipients, eq(amendments.recipientId, recipients.id))
      .orderBy(desc(amendments.updatedAt))
      .limit(5),
    db
      .select({ finishedAt: syncRuns.finishedAt, sourceUpdatedAt: syncRuns.sourceUpdatedAt })
      .from(syncRuns)
      .where(eq(syncRuns.status, "complete"))
      .orderBy(desc(syncRuns.finishedAt))
      .limit(1),
  ]);
  return { totals, states, municipalities, authors, recent, lastSync };
}

export async function searchAll(query: string) {
  const db = getDb();
  const term = `%${query}%`;
  const [recipientRows, amendmentRows, authorRows, expenseRows] = await Promise.all([
    db
      .select()
      .from(recipients)
      .where(or(ilike(recipients.name, term), ilike(recipients.cnpj, term)))
      .limit(20),
    db
      .select()
      .from(amendments)
      .where(or(ilike(amendments.code, term), ilike(amendments.purpose, term)))
      .limit(20),
    db
      .select({ name: amendments.authorName })
      .from(amendments)
      .where(ilike(amendments.authorName, term))
      .groupBy(amendments.authorName)
      .limit(20),
    db
      .select({
        id: expenses.id,
        sourceId: expenses.sourceId,
        supplierName: expenses.supplierName,
        description: expenses.description,
        amount: expenses.amount,
        spentAt: expenses.spentAt,
        proofType: expenses.proofType,
        proofStatus: expenses.proofStatus,
      })
      .from(expenses)
      .where(or(ilike(expenses.supplierName, term), ilike(expenses.description, term)))
      .limit(20),
  ]);
  return {
    recipients: recipientRows,
    amendments: amendmentRows,
    authors: authorRows,
    expenses: expenseRows,
  };
}

export async function getRecipient(id: number) {
  const db = getDb();
  const [recipient] = await db.select().from(recipients).where(eq(recipients.id, id)).limit(1);
  if (!recipient) return null;
  const rows = await db
    .select({
      id: amendments.id,
      code: amendments.code,
      year: amendments.year,
      authorName: amendments.authorName,
      purpose: amendments.purpose,
      authorised: sql<number>`${amendments.authorisedAmount}::float`,
      committed: sql<number>`${amendments.committedAmount}::float`,
      paid: sql<number>`${amendments.paidAmount}::float`,
    })
    .from(amendments)
    .where(eq(amendments.recipientId, id))
    .orderBy(desc(amendments.year));
  const coverage = recipient.fiscalKey
    ? await db.select().from(fiscalCoverages).where(eq(fiscalCoverages.recipientKey, recipient.fiscalKey))
    : [];
  return { recipient, amendments: rows, coverage };
}

export async function getAmendment(id: number) {
  const db = getDb();
  const [row] = await db
    .select({ amendment: amendments, recipient: recipients })
    .from(amendments)
    .innerJoin(recipients, eq(amendments.recipientId, recipients.id))
    .where(eq(amendments.id, id))
    .limit(1);
  if (!row) return null;
  const [paymentRows, expenseRows] = await Promise.all([
    db.select().from(payments).where(eq(payments.amendmentId, id)).orderBy(desc(payments.paidAt)),
    db
      .select({
        expense: expenses,
        kind: expenseLinks.kind,
        reasons: expenseLinks.reasons,
        previousReasons: expenseLinks.previousReasons,
      })
      .from(expenseLinks)
      .innerJoin(expenses, eq(expenseLinks.expenseId, expenses.id))
      .where(eq(expenseLinks.amendmentId, id)),
  ]);
  return { ...row, payments: paymentRows, expenses: expenseRows };
}

export async function getAuthor(name: string) {
  const db = getDb();
  const decoded = decodeURIComponent(name);
  const rows = await db
    .select({
      id: amendments.id,
      code: amendments.code,
      year: amendments.year,
      purpose: amendments.purpose,
      paid: sql<number>`${amendments.paidAmount}::float`,
      authorised: sql<number>`${amendments.authorisedAmount}::float`,
      recipient: recipients.name,
      recipientId: recipients.id,
      state: recipients.state,
    })
    .from(amendments)
    .innerJoin(recipients, eq(amendments.recipientId, recipients.id))
    .where(eq(amendments.authorName, decoded))
    .orderBy(desc(amendments.year));
  return rows.length ? { name: decoded, amendments: rows } : null;
}

export async function getFiscalCoverages() {
  const db = getDb();
  return db.select().from(fiscalCoverages).orderBy(fiscalCoverages.recipientName, fiscalCoverages.source);
}
