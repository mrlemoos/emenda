import {
  bigint,
  bigserial,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const recipientKind = pgEnum("recipient_kind", [
  "municipality",
  "fund",
  "institution",
]);
export const linkKind = pgEnum("link_kind", ["confirmed", "probable"]);
export const syncStatus = pgEnum("sync_status", ["running", "complete", "failed"]);
export const proofType = pgEnum("proof_type", ["nfe", "nfse_nacional", "nfse_municipal", "execucao_orcamentaria"]);
export const proofStatus = pgEnum("proof_status", ["autorizada", "cancelada", "substituida", "registrado"]);
export const coverageSource = pgEnum("coverage_source", [
  "adn_nfse",
  "exportacao_municipal",
  "nfe_distribuicao",
  "execucao_orcamentaria",
]);

export const recipients = pgTable(
  "recipients",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sourceId: bigint("source_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    cnpj: text("cnpj"),
    kind: recipientKind("kind").notNull().default("institution"),
    municipalityIbgeCode: text("municipality_ibge_code"),
    municipalityName: text("municipality_name"),
    state: text("state").notNull(),
    fiscalKey: text("fiscal_key"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("recipients_source_id_idx").on(table.sourceId),
    uniqueIndex("recipients_fiscal_key_idx").on(table.fiscalKey),
    index("recipients_location_idx").on(table.state, table.municipalityName),
    index("recipients_name_idx").on(table.name),
  ],
);

export const amendments = pgTable(
  "amendments",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sourceId: bigint("source_id", { mode: "number" }).notNull(),
    recipientId: bigint("recipient_id", { mode: "number" })
      .notNull()
      .references(() => recipients.id),
    code: text("code").notNull(),
    year: integer("year").notNull(),
    authorName: text("author_name").notNull(),
    authorCode: text("author_code"),
    authorPartyAtPresentation: text("author_party_at_presentation"),
    authorStateAtPresentation: text("author_state_at_presentation"),
    purpose: text("purpose"),
    status: text("status"),
    authorisedAmount: numeric("authorised_amount", { precision: 18, scale: 2 }).notNull(),
    committedAmount: numeric("committed_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    sourceUrl: text("source_url").notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("amendments_source_id_idx").on(table.sourceId),
    index("amendments_recipient_idx").on(table.recipientId),
    index("amendments_author_idx").on(table.authorName),
    index("amendments_year_idx").on(table.year),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sourceId: text("source_id").notNull(),
    amendmentId: bigint("amendment_id", { mode: "number" })
      .notNull()
      .references(() => amendments.id),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    paidAt: date("paid_at"),
    documentNumber: text("document_number"),
    sourceUrl: text("source_url").notNull(),
  },
  (table) => [uniqueIndex("payments_source_id_idx").on(table.sourceId)],
);

export const sourceCommitments = pgTable(
  "source_commitments",
  {
    sourceId: bigint("source_id", { mode: "number" }).primaryKey(),
    amendmentId: bigint("amendment_id", { mode: "number" })
      .notNull()
      .references(() => amendments.id),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  },
  (table) => [index("source_commitments_amendment_idx").on(table.amendmentId)],
);

export const expenses = pgTable(
  "expenses",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sourceId: text("source_id").notNull(),
    recipientId: bigint("recipient_id", { mode: "number" })
      .notNull()
      .references(() => recipients.id),
    recipientKey: text("recipient_key").notNull().default("unknown"),
    supplierName: text("supplier_name").notNull(),
    supplierDocument: text("supplier_document"),
    description: text("description"),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    spentAt: date("spent_at"),
    invoiceKey: text("invoice_key"),
    proofType: proofType("proof_type"),
    proofStatus: proofStatus("proof_status"),
    proofSourceLabel: text("proof_source_label"),
    proofUpdatedAt: timestamp("proof_updated_at", { withTimezone: true }),
    liquidationId: text("liquidation_id"),
    paymentId: text("payment_id"),
    sourceUrl: text("source_url").notNull(),
  },
  (table) => [
    uniqueIndex("expenses_source_id_idx").on(table.sourceId),
    index("expenses_recipient_key_idx").on(table.recipientKey),
    index("expenses_supplier_name_idx").on(table.supplierName),
  ],
);

export const expenseLinks = pgTable(
  "expense_links",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    amendmentId: bigint("amendment_id", { mode: "number" })
      .notNull()
      .references(() => amendments.id),
    expenseId: bigint("expense_id", { mode: "number" })
      .notNull()
      .references(() => expenses.id),
    kind: linkKind("kind").notNull(),
    reasons: text("reasons").array().notNull(),
    previousReasons: text("previous_reasons").array(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("expense_links_pair_idx").on(table.amendmentId, table.expenseId)],
);

export const fiscalCoverages = pgTable(
  "fiscal_coverages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    recipientKey: text("recipient_key").notNull(),
    recipientName: text("recipient_name").notNull(),
    recipientId: bigint("recipient_id", { mode: "number" }).references(() => recipients.id),
    source: coverageSource("source").notNull(),
    sourceLabel: text("source_label").notNull(),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    knownGaps: text("known_gaps").array().notNull().default([]),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("fiscal_coverages_recipient_source_idx").on(table.recipientKey, table.source)],
);

export const sourceCursors = pgTable("source_cursors", {
  source: text("source").primaryKey(),
  lastNsu: text("last_nsu").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const syncRuns = pgTable("sync_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  source: text("source").notNull(),
  status: syncStatus("status").notNull().default("running"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
  rowsProcessed: integer("rows_processed").notNull().default(0),
  error: text("error"),
});
