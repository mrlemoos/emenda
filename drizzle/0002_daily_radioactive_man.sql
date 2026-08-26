CREATE TYPE "public"."coverage_source" AS ENUM('adn_nfse', 'exportacao_municipal', 'nfe_distribuicao', 'execucao_orcamentaria');--> statement-breakpoint
CREATE TYPE "public"."proof_status" AS ENUM('autorizada', 'cancelada', 'substituida');--> statement-breakpoint
CREATE TYPE "public"."proof_type" AS ENUM('nfe', 'nfse_nacional', 'nfse_municipal');--> statement-breakpoint
CREATE TABLE "fiscal_coverages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"recipient_key" text NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_id" bigint,
	"source" "coverage_source" NOT NULL,
	"source_label" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"known_gaps" text[] DEFAULT '{}' NOT NULL,
	"last_synced_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source_cursors" (
	"source" text PRIMARY KEY NOT NULL,
	"last_nsu" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_links" ADD COLUMN "previous_reasons" text[];--> statement-breakpoint
ALTER TABLE "expense_links" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "recipient_key" text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "proof_type" "proof_type";--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "proof_status" "proof_status";--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "proof_source_label" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "proof_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "liquidation_id" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "recipients" ADD COLUMN "fiscal_key" text;--> statement-breakpoint
ALTER TABLE "fiscal_coverages" ADD CONSTRAINT "fiscal_coverages_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fiscal_coverages_recipient_source_idx" ON "fiscal_coverages" USING btree ("recipient_key","source");--> statement-breakpoint
CREATE INDEX "expenses_recipient_key_idx" ON "expenses" USING btree ("recipient_key");--> statement-breakpoint
CREATE INDEX "expenses_supplier_name_idx" ON "expenses" USING btree ("supplier_name");--> statement-breakpoint
CREATE UNIQUE INDEX "recipients_fiscal_key_idx" ON "recipients" USING btree ("fiscal_key");