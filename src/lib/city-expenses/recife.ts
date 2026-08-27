import type { MunicipalExpense, MunicipalExpenseDelivery } from "./types";
import { cnpj, field, money, text, type CkanRow } from "./values";

const DATASET_URL = "https://dados.recife.pe.gov.br";
const DATASET_ID = "despesas-orcamentarias";
const SOURCE_LABEL = "Portal de Dados Abertos do Recife · gastos agregados por credor";

type CkanResource = {
  id: string;
  name: string;
  datastore_active: boolean;
  url: string;
};

/** Normalises Recife's public by-creditor rows. The source has no federal amendment field. */
export function normaliseRecifeRows(rows: CkanRow[], year: number, sourceUrl: string): MunicipalExpenseDelivery {
  const expenses = aggregateRows(rows, year, sourceUrl);
  const months = rows.map((row) => Number(field(row, "Mês"))).filter((month) => Number.isInteger(month) && month >= 1 && month <= 12);
  const first = months.length ? Math.min(...months) : 1;
  const last = months.length ? Math.max(...months) : 12;
  return {
    recipient: { key: "recife", name: "Recife", state: "PE", municipalityIbgeCode: "2611606" },
    sourceLabel: SOURCE_LABEL,
    periodStart: `${year}-${String(first).padStart(2, "0")}-01`,
    periodEnd: new Date(Date.UTC(year, last, 0)).toISOString().slice(0, 10),
    knownGaps: [
      "A base por credor não declara fonte de recurso nem emenda federal",
      "Publicamos valores agregados por credor, órgão e mês. A fonte não traz identificador verificável de empenho ou pagamento para despesa individual.",
    ],
    expenses,
  };
}

function aggregateRows(rows: CkanRow[], year: number, sourceUrl: string): MunicipalExpense[] {
  const aggregates = new Map<string, MunicipalExpense>();

  for (const row of rows) {
    const amount = nonZero(money(field(row, "Pagamento"))) ?? nonZero(money(field(row, "Liquidação")));
    if (!amount) continue;

    const month = Number(field(row, "Mês"));
    const periodMonth = Number.isInteger(month) && month >= 1 && month <= 12 ? month : 12;
    const supplierName = text(field(row, "Nome do Credor")) ?? "Credor não informado";
    const supplierDocument = cnpj(field(row, "CPF/CNPJ"));
    const organ = text(field(row, "Órgão")) ?? text(field(row, "Unidade")) ?? "Órgão não informado";
    const key = [
      year,
      periodMonth,
      text(field(row, "Código do Órgão")) ?? organ,
      text(field(row, "Código da Unidade")) ?? "",
      supplierDocument ?? supplierName,
    ].join(":");
    const previous = aggregates.get(key);

    aggregates.set(key, {
      sourceId: `recife:agregado:${key}`,
      supplierName,
      supplierDocument,
      description: `Gasto agregado de ${String(periodMonth).padStart(2, "0")}/${year} · ${organ}`,
      amount: addMoney(previous?.amount, amount),
      spentAt: new Date(Date.UTC(year, periodMonth, 0)).toISOString().slice(0, 10),
      liquidationId: null,
      paymentId: null,
      sourceUrl,
      sourceLabel: SOURCE_LABEL,
    });
  }

  return [...aggregates.values()];
}

function addMoney(left: string | undefined, right: string) {
  return ((Number(left ?? "0") * 100 + Number(right) * 100) / 100).toFixed(2);
}

function nonZero(value: string | null) {
  return value && Number(value) !== 0 ? value : null;
}

function pickResource(resources: CkanResource[], year: number): CkanResource {
  const match = resources.find(
    (resource) =>
      resource.datastore_active &&
      resource.name.toLocaleLowerCase("pt-BR").includes("despesas por credor") &&
      resource.name.includes(String(year)),
  );
  if (!match) throw new Error(`Recife não publicou recurso por credor com datastore para ${year}`);
  return match;
}

async function ckan<T>(path: string): Promise<T> {
  const response = await fetch(`${DATASET_URL}/api/3/action/${path}`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; Emenda/0.1; transparencia@emenda.org)" },
  });
  if (!response.ok) throw new Error(`CKAN Recife respondeu ${response.status} em ${path}`);

  const data = (await response.json()) as { success?: boolean; result?: T };
  if (!data.success || !data.result) throw new Error(`CKAN Recife recusou ${path}`);
  return data.result;
}

/** Fetches the official public CKAN resource for Recife's by-creditor expenses. */
export async function fetchRecifeExpenses(year: number): Promise<MunicipalExpenseDelivery> {
  if (!Number.isInteger(year) || year < 2020 || year > new Date().getUTCFullYear()) {
    throw new Error("Recife suporta anos de 2020 até o ano atual");
  }

  const metadata = await ckan<{ resources: unknown[] }>(`package_show?id=${DATASET_ID}`);
  if (!Array.isArray(metadata.resources)) throw new Error("Recife retornou metadados CKAN inválidos");
  const resource = pickResource(metadata.resources.filter(isCkanResource), year);
  const rows: CkanRow[] = [];
  const limit = 1_000;

  for (let offset = 0; ; offset += limit) {
    const page = await ckan<{ records: CkanRow[] }>(
      `datastore_search?resource_id=${encodeURIComponent(resource.id)}&limit=${limit}&offset=${offset}&sort=_id%20asc`,
    );
    if (!Array.isArray(page.records)) throw new Error("Recife retornou dados CKAN inválidos");
    rows.push(...page.records);
    if (page.records.length < limit) break;
  }

  return {
    ...normaliseRecifeRows(rows, year, resource.url),
  };
}

function isCkanResource(value: unknown): value is CkanResource {
  return Boolean(
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "datastore_active" in value &&
    typeof value.datastore_active === "boolean" &&
    "url" in value &&
    typeof value.url === "string",
  );
}
