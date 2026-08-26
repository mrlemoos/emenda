import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { amendments, payments, recipients } from "@/db/schema";
import { loadPublicGastosFromDb, publicGastosCsv } from "@/lib/fiscal";

const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";
  const columns = Object.keys(rows[0]);
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [columns.map(escape).join(","), ...rows.map((row) => columns.map((column) => escape(row[column])).join(","))].join("\n");
};

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!(["emendas", "pagamentos", "gastos"] as const).includes(kind as "emendas" | "pagamentos" | "gastos")) {
    return Response.json({ error: "Arquivo desconhecido" }, { status: 404 });
  }

  const db = getDb();
  let body: string;
  if (kind === "emendas") {
    const rows = await db
      .select({
        codigo: amendments.code,
        ano: amendments.year,
        parlamentar: amendments.authorName,
        recebedor: recipients.name,
        cnpj_recebedor: recipients.cnpj,
        uf: recipients.state,
        objeto: amendments.purpose,
        autorizado: amendments.authorisedAmount,
        empenhado: amendments.committedAmount,
        pago: amendments.paidAmount,
        fonte: amendments.sourceUrl,
      })
      .from(amendments)
      .innerJoin(recipients, eq(amendments.recipientId, recipients.id));
    body = csv(rows);
  } else if (kind === "pagamentos") {
    const rows = await db
      .select({
        emenda: amendments.code,
        documento: payments.documentNumber,
        data: payments.paidAt,
        valor: payments.amount,
        fonte: payments.sourceUrl,
      })
      .from(payments)
      .innerJoin(amendments, eq(payments.amendmentId, amendments.id));
    body = csv(rows);
  } else {
    body = publicGastosCsv(await loadPublicGastosFromDb({}));
  }

  return new Response(`\uFEFF${body}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="emenda-${kind}.csv"`,
    },
  });
}
