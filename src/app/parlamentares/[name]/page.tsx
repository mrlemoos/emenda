import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthor } from "@/lib/data";
import { formatMoney } from "@/lib/format";

export default async function AuthorPage({ params }: PageProps<"/parlamentares/[name]">) {
  const data = await getAuthor((await params).name);
  if (!data) notFound();
  const paid = data.amendments.reduce((total, row) => total + row.paid, 0);
  return (
    <main className="content-page">
      <header><p className="kicker">Parlamentar</p><h1>{data.name}</h1><p className="lede">{formatMoney(paid)} pagos em {data.amendments.length} emendas encontradas.</p></header>
      <ul className="result-list">{data.amendments.map((row) => <li key={row.id}><Link href={`/emendas/${row.id}`}><strong>{row.purpose || `Emenda ${row.code}`}</strong><small>{row.recipient} · {row.state} · {row.year}</small></Link><strong>{formatMoney(row.paid)}</strong></li>)}</ul>
    </main>
  );
}
