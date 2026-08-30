import type { Metadata } from "next";
import { IBM_Plex_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { buyMeACoffeeUrl, githubProfileUrl, githubRepoUrl } from "@/lib/brand";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const serif = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Emenda", template: "%s | Emenda" },
  description: "Veja para onde foi o dinheiro das emendas parlamentares.",
  applicationName: "Emenda",
  appleWebApp: { title: "Emenda" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <SiteHeader />{children}
        <footer>
          <span>Emenda é independente e usa dados públicos.</span>
          <div className="footer-links">
            <a href={`${githubRepoUrl}/issues`} target="_blank">Encontrou um erro? Abra uma issue ↗</a>
            <a href={githubProfileUrl} target="_blank">Apoie no GitHub ↗</a>
            <a href={buyMeACoffeeUrl} target="_blank">Pague um café ↗</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
