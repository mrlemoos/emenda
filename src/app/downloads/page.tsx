import Link from "next/link";

export default function DownloadsPage() {
  return (
    <main className="content-page"><header><p className="kicker">Dados abertos</p><h1>Baixe e confira.</h1><p className="lede">Arquivos separados evitam duplicar valores quando você soma os dados.</p></header>
      <div className="downloads"><Link className="download-card" href="/api/downloads/emendas" download>Emendas <span>CSV ↓</span></Link><Link className="download-card" href="/api/downloads/pagamentos" download>Pagamentos <span>CSV ↓</span></Link><Link className="download-card" href="/api/downloads/gastos" download>Gastos correspondentes <span>CSV ↓</span></Link></div>
    </main>
  );
}
