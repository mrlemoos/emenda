CREATE TABLE "source_commitments" (
	"source_id" bigint PRIMARY KEY NOT NULL,
	"amendment_id" bigint NOT NULL,
	"amount" numeric(18, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_commitments" ADD CONSTRAINT "source_commitments_amendment_id_amendments_id_fk" FOREIGN KEY ("amendment_id") REFERENCES "public"."amendments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_commitments_amendment_idx" ON "source_commitments" USING btree ("amendment_id");