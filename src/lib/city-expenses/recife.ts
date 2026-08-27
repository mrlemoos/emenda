import type { MunicipalExpense, MunicipalExpenseDelivery } from "./types";
import { cnpj, date, field, money, text, type CkanRow } from "./values";

const DATASET_URL = "https://dados.recife.pe.gov.br";
const DATASET_ID = "despesas-orcamentarias";
const SOURCE_LABEL = "Portal de Dados Abertos do Recife · Despesas por credor";

type CkanResource = {
  id: string;
  name: string;
  datastore_active: boolean;
  url: string;
};

function sourceId(row: CkanRow, resourceId: string): string {
  const ckanId = text(field(row, "_id"));
  if (ckanId) return `${resourceId}:${ckanId}`;

  return [
    "recife",
    resourceId,
    text(field(row, "Ano")) ?? "",
    text(field(row, "Mês")) ?? "",
    text(field(row, "Código da Unidade")) ?? "",
    cnpj(field(row, "CPF/CNPJ")) ?? "",
    text(field(row, "Código do Órgão")) ?? "",
    date(field(row, "Data do Empenho")) ?? "",
  ].join(":");
}

/** Normalises Recife's public by-creditor rows. The source has no federal amendment field. */
export function normaliseRecifeRows(rows: CkanRow[], year: number, sourceUrl: string): MunicipalExpenseDelivery {
  const resourceId = sourceUrl;
  const expenses = rows.flatMap((row) => normaliseRow(row, resourceId, sourceUrl));
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
      "O recurso por credor não traz identificador verificável de empenho ou de pagamento para ligar uma linha a uma despesa individual.",
    ],
    expenses,
  };
}

function normaliseRow(row: CkanRow, resourceId: string, sourceUrl: string): MunicipalExpense[] {
  const amount = nonZero(money(field(row, "Pagamento"))) ?? nonZero(money(field(row, "Liquidação")));
  if (!amount) return [];

  return [{
    sourceId: sourceId(row, resourceId),
    supplierName: text(field(row, "Nome do Credor")) ?? "Credor não informado",
    supplierDocument: cnpj(field(row, "CPF/CNPJ")),
    description: text(field(row, "Órgão")) ?? text(field(row, "Unidade")),
    amount,
    spentAt: date(field(row, "Data de Pagamento")) ?? date(field(row, "Data do Empenho")),
    liquidationId: null,
    paymentId: null,
    sourceUrl,
    sourceLabel: SOURCE_LABEL,
    federalAmendmentCode: null,
  }];
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
  const metadata = await ckan<{ resources: unknown[] }>(`package_show?id=${DATASET_ID}`);
  const resource = pickResource(metadata.resources.filter(isCkanResource), year);
  const rows: CkanRow[] = [];
  const limit = 1_000;

  for (let offset = 0; ; offset += limit) {
    const page = await ckan<{ records: CkanRow[] }>(
      `datastore_search?resource_id=${encodeURIComponent(resource.id)}&limit=${limit}&offset=${offset}`,
    );
    rows.push(...page.records);
    if (page.records.length < limit) break;
  }

  return {
    ...normaliseRecifeRows(rows, year, resource.url),
  };
}

function isCkanResource(value: unknown): value is CkanResource {
  return Boolean(value && typeof value === "object" && "id" in value && "name" in value && "url" in value);
}
