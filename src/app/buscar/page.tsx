import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { searchAll } from "@/lib/data";
import { formatMoney } from "@/lib/format";

const proofLabel = {
  nfe: "NF-e",
  nfse_nacional: "NFS-e nacional",
  nfse_municipal: "NFS-e municipal",
} as const;

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const params = await searchParams;
  const value = params.q;
  const query = Array.isArray(value) ? value[0] : (value ?? "");
  const results = query
    ? await searchAll(query)
    : { recipients: [], amendments: [], authors: [], expenses: [] };
  const count =
    results.recipients.length +
    results.amendments.length +
    results.authors.length +
    results.expenses.length;
  return (
    <main className="content-page">
      <header>
        <p className="kicker">Busca</p>
        <h1>{query || "Procure na base"}</h1>
      </header>
      <SearchForm defaultValue={query} />
      {!count ? (
        <div className="empty-state">Nenhum resultado encontrado.</div>
      ) : (
        <ul className="result-list">
          {results.recipients.map((row) => (
            <li key={`r-${row.id}`}>
              <Link href={`/recebedores/${row.id}`}>
                <strong>{row.name}</strong>
                <small>
                  Recebedor · {row.state}
                  {row.cnpj ? ` · ${row.cnpj}` : ""}
                </small>
              </Link>
              <span>Ver →</span>
            </li>
          ))}
          {results.authors.map((row) => (
            <li key={`a-${row.name}`}>
              <Link href={`/parlamentares/${encodeURIComponent(row.name)}`}>
                <strong>{row.name}</strong>
                <small>Parlamentar</small>
              </Link>
              <span>Ver →</span>
            </li>
          ))}
          {results.amendments.map((row) => (
            <li key={`e-${row.id}`}>
              <Link href={`/emendas/${row.id}`}>
                <strong>Emenda {row.code}</strong>
                <small>
                  {row.year} · {row.purpose}
                </small>
              </Link>
              <span>Ver →</span>
            </li>
          ))}
          {results.expenses.map((row) => (
            <li key={`g-${row.id}`}>
              <div>
                <strong>{row.supplierName}</strong>
                <small>
                  Gasto
                  {row.proofType ? ` · ${proofLabel[row.proofType]}` : ""}
                  {row.proofStatus ? ` · ${row.proofStatus}` : ""}
                  {row.description ? ` · ${row.description}` : ""} · {formatMoney(Number(row.amount))}
                </small>
              </div>
              <span>{row.sourceId}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
