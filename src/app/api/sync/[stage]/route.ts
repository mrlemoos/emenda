import { revalidatePath } from "next/cache";
import { syncTransferegov, type SyncStage } from "@/lib/sync";

export const maxDuration = 300;
const stages = new Set<SyncStage>(["beneficiarios", "emendas", "empenhos", "pagamentos"]);

export async function GET(request: Request, { params }: { params: Promise<{ stage: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Não autorizado" }, { status: 401 });
  const { stage } = await params;
  if (!stages.has(stage as SyncStage)) return Response.json({ error: "Etapa desconhecida" }, { status: 404 });
  try {
    const result = await syncTransferegov(stage as SyncStage);
    revalidatePath("/", "page");
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha na sincronização" }, { status: 502 });
  }
}
