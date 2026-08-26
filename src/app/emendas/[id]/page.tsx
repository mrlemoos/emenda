import Link from "next/link";
import { notFound } from "next/navigation";
import { getAmendment } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

const proofLabel = {
  nfe: "NF-e",
  nfse_nacional: "NFS-e nacional",
  nfse_municipal: "NFS-e municipal",
} as const;

export default async function AmendmentPage({ params }: PageProps<"/emendas/[id]">) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const data = await getAmendment(id);
  if (!data) notFound();
  const amendment = data.amendment;
  return (
    <main className="content-page">
      <header>
        <p className="kicker">
          Emenda {amendment.code} · {amendment.year}
        </p>
        <h1>{amendment.purpose || "Sem descrição na fonte"}</h1>
        <p className="lede">
          Enviada por {amendment.authorName} para{" "}
          <Link href={`/recebedores/${data.recipient.id}`}>{data.recipient.name}</Link>.
        </p>
      </header>
      <section className="money-flow">
        <div>
          <span>Autorizado</span>
          <strong>{formatMoney(Number(amendment.authorisedAmount))}</strong>
        </div>
        <div>
          <span>Empenhado</span>
          <strong>{formatMoney(Number(amendment.committedAmount))}</strong>
        </div>
        <div>
          <span>Pago</span>
          <strong>{formatMoney(Number(amendment.paidAmount))}</strong>
        </div>
      </section>
      <section className="prose">
        <h2>Pagamentos</h2>
        {data.payments.length ? (
          <ul>
            {data.payments.map((payment) => (
              <li key={payment.id}>
                {payment.paidAt ? formatDate(payment.paidAt) : "Sem data"} ·{" "}
                {formatMoney(Number(payment.amount))}
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem pagamento encontrado na fonte consultada.</p>
        )}
        <h2>Como foi gasto</h2>
        <p>
          Dinheiro enviado é a transferência federal. Gasto é a execução pelo recebedor, quando houver
          comprovação na cobertura consultada.
        </p>
        {data.expenses.length ? (
          <ul>
            {data.expenses.map(({ expense, kind, reasons }) => (
              <li key={expense.id}>
                <span className="tag">{kind === "confirmed" ? "confirmado" : "provável"}</span>{" "}
                {expense.proofType ? (
                  <span className="tag">{proofLabel[expense.proofType]}</span>
                ) : null}{" "}
                {expense.proofStatus ? <span className="tag">{expense.proofStatus}</span> : null}{" "}
                {expense.description || expense.supplierName} · {formatMoney(Number(expense.amount))}
                <small>
                  {expense.supplierName}
                  {expense.spentAt ? ` · ${formatDate(expense.spentAt)}` : ""}
                  {expense.invoiceKey ? ` · chave ${expense.invoiceKey}` : ""}
                  {expense.proofSourceLabel ? ` · fonte ${expense.proofSourceLabel}` : ""}
                  {reasons.length ? ` · ${reasons.join("; ")}` : ""}
                </small>
                {expense.sourceUrl?.startsWith("http") ? (
                  <p>
                    <a href={expense.sourceUrl} target="_blank" rel="noreferrer">
                      Abrir fonte da comprovação ↗
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>Sem comprovação encontrada nas fontes consultadas.</p>
        )}
        <p>
          <a href={amendment.sourceUrl} target="_blank" rel="noreferrer">
            Abrir fonte oficial ↗
          </a>
        </p>
      </section>
    </main>
  );
}
