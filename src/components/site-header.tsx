import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="Emenda, página inicial">emenda<span>.</span></Link>
      <nav aria-label="Principal">
        <Link href="/#mapa">Mapa</Link><Link href="/#rankings">Rankings</Link><Link href="/metodologia">Como sabemos?</Link><Link href="/downloads">Baixar dados</Link>
      </nav>
      <Link className="github-link" href="https://github.com/" target="_blank">Código aberto ↗</Link>
    </header>
  );
}
