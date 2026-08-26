import Link from "next/link";
import { BrazilMap } from "@/components/brazil-map";
import { SearchForm } from "@/components/search-form";
import { getOverview } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export default async function Home() {
  const { totals, states, municipalities, authors, recent, lastSync } = await getOverview();
  const hasData = totals.amendments > 0;
  return (
    <main>
      <section className="hero ruled">
        <p className="kicker">Dinheiro público, em português claro</p>
        <h1>Veja para onde<br />foi o dinheiro.</h1>
        <p className="hero-copy">Acompanhe emendas parlamentares, quem recebeu e quais gastos conseguimos comprovar.</p>
        <SearchForm large />
        <p className="coverage-note">
          {lastSync?.sourceUpdatedAt ? `Fonte atualizada em ${formatDate(lastSync.sourceUpdatedAt)}.` : "Base pronta. A primeira sincronização ainda não terminou."}{" "}
          <Link href="/metodologia">Veja nossa cobertura →</Link>
        </p>
      </section>

      <section className="numbers" aria-label="Resumo nacional">
        <div><span>Dinheiro enviado</span><strong>{formatMoney(totals.paid, true)}</strong></div>
        <div><span>Emendas encontradas</span><strong>{totals.amendments.toLocaleString("pt-BR")}</strong></div>
        <div><span>Quem recebeu</span><strong>{totals.recipients.toLocaleString("pt-BR")}</strong></div>
        <div className="stamp"><span>Cobertura</span><strong>Brasil inteiro</strong><small>Floripa e SP capital em detalhe</small></div>
      </section>

      <section className="map-section ruled" id="mapa">
        <div className="section-heading"><p className="kicker">Explore por estado</p><h2>Quanto chegou<br />perto de você?</h2><p>Quanto mais escuro, mais dinheiro pago aos recebedores daquele estado.</p></div>
        <BrazilMap totals={states} />
      </section>

      <section className="rankings ruled" id="rankings">
        <div className="section-title-row"><div><p className="kicker">Os maiores valores</p><h2>Rankings</h2></div><span>Valor pago · reais nominais</span></div>
        {!hasData ? <div className="empty-state">Sem ranking até a primeira sincronização. Nada de números inventados.</div> : (
          <div className="ranking-columns">
            <ol><li className="list-title">Municípios e instituições</li>{municipalities.map((row, index) => <li key={row.id}><b>{String(index + 1).padStart(2, "0")}</b><Link href={`/recebedores/${row.id}`}>{row.name}<small>{row.state}</small></Link><strong>{formatMoney(row.paid, true)}</strong></li>)}</ol>
            <ol><li className="list-title">Parlamentares</li>{authors.map((row, index) => <li key={row.name}><b>{String(index + 1).padStart(2, "0")}</b><Link href={`/parlamentares/${encodeURIComponent(row.name)}`}>{row.name}</Link><strong>{formatMoney(row.paid, true)}</strong></li>)}</ol>
          </div>
        )}
      </section>

      <section className="recent ruled">
        <div className="section-title-row"><div><p className="kicker">Na base agora</p><h2>Emendas recentes</h2></div><Link href="/buscar?q=">Ver todas →</Link></div>
        {recent.length ? recent.map((row) => <article key={row.id}><span>{row.year}</span><div><p>{row.recipient} · {row.state}</p><h3><Link href={`/emendas/${row.id}`}>{row.purpose || `Emenda ${row.code}`}</Link></h3><small>{row.authorName}</small></div><strong>{formatMoney(row.paid)}</strong></article>) : <div className="empty-state">Emendas aparecerão aqui depois da sincronização.</div>}
      </section>
    </main>
  );
}
