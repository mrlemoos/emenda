import { revalidatePath } from "next/cache";
import { isCityExpenseSync, syncCityExpenses } from "@/lib/city-expenses/sync";

export const maxDuration = 300;

export async function GET(request: Request, { params }: { params: Promise<{ city: string }> }) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { city } = await params;
  if (!isCityExpenseSync(city)) return Response.json({ error: "Cidade desconhecida" }, { status: 404 });

  const yearValue = new URL(request.url).searchParams.get("ano");
  const year = yearValue ? Number(yearValue) : new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < 2020 || year > new Date().getUTCFullYear()) {
    return Response.json({ error: "Ano inválido" }, { status: 400 });
  }

  try {
    const result = await syncCityExpenses(city, year);
    revalidatePath("/", "layout");
    return Response.json({ city, year, ...result });
  } catch (error) {
    console.error("Falha na sincronização de gastos municipais", { city, year, error });
    return Response.json({ error: error instanceof Error ? error.message : "Falha na sincronização" }, { status: 502 });
  }
}
