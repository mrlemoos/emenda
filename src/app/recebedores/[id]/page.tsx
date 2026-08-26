import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipient } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export default async function RecipientPage({ params }: PageProps<"/recebedores/[id]">) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id)) notFound();
  const data = await getRecipient(id);
  if (!data) notFound();
  const paid = data.amendments.reduce((total, row) => total + row.paid, 0);
  return (
    <main className="content-page">
      <header>
        <p className="kicker">Recebedor · {data.recipient.state}</p>
        <h1>{data.recipient.name}</h1>
        <p className="lede">
          Recebeu {formatMoney(paid)} em {data.amendments.length} emendas encontradas.
        </p>
      </header>
      {data.coverage.length ? (
        <section className="prose">
          <h2>Cobertura fiscal</h2>
          <ul>
            {data.coverage.map((row) => (
              <li key={`${row.source}`}>
                {row.sourceLabel}: {formatDate(row.periodStart)} a {formatDate(row.periodEnd)}. Última
                sincronização {formatDate(row.lastSyncedAt)}.
                {row.knownGaps.length ? ` Lacunas: ${row.knownGaps.join("; ")}.` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ul className="result-list">
        {data.amendments.map((row) => (
          <li key={row.id}>
            <Link href={`/emendas/${row.id}`}>
              <strong>{row.purpose || `Emenda ${row.code}`}</strong>
              <small>
                {row.year} · {row.authorName}
              </small>
            </Link>
            <strong>{formatMoney(row.paid)}</strong>
          </li>
        ))}
      </ul>
    </main>
  );
}
