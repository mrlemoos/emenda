import { revalidatePath } from "next/cache";
import {
  ingestAuthorizedDeliveryToDb,
  type AuthorizedFiscalDelivery,
} from "@/lib/fiscal";

export const maxDuration = 300;

function authorised(request: Request) {
  const secret = process.env.FISCAL_INGEST_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  let delivery: AuthorizedFiscalDelivery;
  try {
    delivery = (await request.json()) as AuthorizedFiscalDelivery;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!delivery?.recipientScope?.recipientKey || !Array.isArray(delivery.documents)) {
    return Response.json({ error: "Entrega fiscal incompleta" }, { status: 400 });
  }

  try {
    const result = await ingestAuthorizedDeliveryToDb(delivery);
    revalidatePath("/", "layout");
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Falha na ingestão fiscal" },
      { status: 502 },
    );
  }
}
