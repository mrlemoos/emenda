import Link from "next/link";
import { formatMoney } from "@/lib/format";

const positions: Record<string, [number, number]> = {
  RR: [4, 0], AP: [7, 0], AM: [2, 1], PA: [6, 1], MA: [9, 2], CE: [11, 2], RN: [13, 2], AC: [0, 2], RO: [2, 3], TO: [7, 3], PI: [9, 3], PB: [12, 3], PE: [11, 4], AL: [12, 5], SE: [11, 6], BA: [9, 5], MT: [5, 4], GO: [7, 5], DF: [7, 4], MS: [5, 6], MG: [8, 6], ES: [10, 7], RJ: [9, 8], SP: [7, 7], PR: [6, 8], SC: [6, 9], RS: [5, 10],
};

export function BrazilMap({ totals }: { totals: { state: string; paid: number }[] }) {
  const values = new Map(totals.map((row) => [row.state, row.paid]));
  const max = Math.max(...totals.map((row) => row.paid), 1);
  return (
    <div className="map-grid" role="img" aria-label="Cartograma do Brasil por unidade federativa">
      {Object.entries(positions).map(([state, [column, row]]) => {
        const paid = values.get(state) ?? 0;
        const style = { gridColumn: column + 1, gridRow: row + 1, "--shade": paid ? 0.16 + (paid / max) * 0.84 : 0.06 } as React.CSSProperties;
        return <Link key={state} href={`/buscar?q=${state}`} style={style} aria-label={`${state}: ${formatMoney(paid)}`} title={`${state}: ${formatMoney(paid)}`}>{state}</Link>;
      })}
    </div>
  );
}
