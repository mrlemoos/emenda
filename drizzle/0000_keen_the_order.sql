CREATE TYPE "public"."link_kind" AS ENUM('confirmed', 'probable');--> statement-breakpoint
CREATE TYPE "public"."recipient_kind" AS ENUM('municipality', 'fund', 'institution');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'complete', 'failed');--> statement-breakpoint
CREATE TABLE "amendments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" bigint NOT NULL,
	"recipient_id" bigint NOT NULL,
	"code" text NOT NULL,
	"year" integer NOT NULL,
	"author_name" text NOT NULL,
	"author_code" text,
	"author_party_at_presentation" text,
	"author_state_at_presentation" text,
	"purpose" text,
	"status" text,
	"authorised_amount" numeric(18, 2) NOT NULL,
	"committed_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(18, 2) DEFAULT '0' NOT NULL,
	"source_url" text NOT NULL,
	"source_updated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_links" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"amendment_id" bigint NOT NULL,
	"expense_id" bigint NOT NULL,
	"kind" "link_kind" NOT NULL,
	"reasons" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"recipient_id" bigint NOT NULL,
	"supplier_name" text NOT NULL,
	"supplier_document" text,
	"description" text,
	"amount" numeric(18, 2) NOT NULL,
	"spent_at" date,
	"invoice_key" text,
	"source_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"amendment_id" bigint NOT NULL,
	"amount" numeric(18, 2) NOT NULL,
	"paid_at" date,
	"document_number" text,
	"source_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" bigint NOT NULL,
	"name" text NOT NULL,
	"cnpj" text,
	"kind" "recipient_kind" DEFAULT 'institution' NOT NULL,
	"municipality_ibge_code" text,
	"municipality_name" text,
	"state" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"rows_processed" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_links" ADD CONSTRAINT "expense_links_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "public"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_links" ADD CONSTRAINT "expense_links_expense_id_expenses_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "public"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "amendments_source_id_idx" ON "amendments" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "amendments_recipient_idx" ON "amendments" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "amendments_author_idx" ON "amendments" USING btree ("author_name");--> statement-breakpoint
CREATE INDEX "amendments_year_idx" ON "amendments" USING btree ("year");--> statement-breakpoint
CREATE UNIQUE INDEX "expense_links_pair_idx" ON "expense_links" USING btree ("amendment_id","expense_id");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_source_id_idx" ON "expenses" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_source_id_idx" ON "payments" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipients_source_id_idx" ON "recipients" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "recipients_location_idx" ON "recipients" USING btree ("state","municipality_name");--> statement-breakpoint
CREATE INDEX "recipients_name_idx" ON "recipients" USING btree ("name");