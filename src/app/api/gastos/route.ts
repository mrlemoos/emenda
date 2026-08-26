import { loadCoverageFromDb, loadPublicGastosFromDb } from "@/lib/fiscal";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const amendmentCode = url.searchParams.get("emenda") ?? undefined;
  const recipientKey = url.searchParams.get("recebedor") ?? undefined;
  const supplierName = url.searchParams.get("fornecedor") ?? undefined;
  const from = url.searchParams.get("de") ?? undefined;
  const to = url.searchParams.get("ate") ?? undefined;
  const coverageKey = url.searchParams.get("cobertura") ?? recipientKey;

  const [gastos, coverage] = await Promise.all([
    loadPublicGastosFromDb({ amendmentCode, recipientKey, supplierName, from, to }),
    coverageKey ? loadCoverageFromDb(coverageKey) : Promise.resolve(null),
  ]);

  return Response.json({
    gastos,
    coverage,
    emptyMessage: gastos.length ? null : "Sem comprovação encontrada nas fontes consultadas",
  });
}
