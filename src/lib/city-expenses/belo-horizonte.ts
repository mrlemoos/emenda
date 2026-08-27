import type { MunicipalExpense, MunicipalExpenseDelivery } from "./types";
import { cnpj, date, field, money, text, type CkanRow } from "./values";

const PACKAGE_URL = "https://dados.pbh.gov.br/api/3/action/package_show?id=despesas-orcamentarias";
const SOURCE_LABEL = "Prefeitura de Belo Horizonte, Despesas Orçamentárias";

type CkanResource = {
  id: string;
  name?: string;
  description?: string;
  url: string;
  datastore_active?: boolean;
};

type CkanPackageResponse = { result: { resources: CkanResource[] } };
type CkanRecordsResponse = { result: { records: CkanRow[] } };

export async function fetchBeloHorizonteExpenses(year: number): Promise<MunicipalExpenseDelivery> {
  if (!Number.isInteger(year) || year < 2020 || year > new Date().getUTCFullYear()) {
    throw new Error("Belo Horizonte supports years from 2020 through the current year");
  }

  const metadata = await fetchJson<CkanPackageResponse>(PACKAGE_URL);
  const resource = metadata.result.resources.find((candidate) =>
    candidate.datastore_active && [candidate.name, candidate.description, candidate.url]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.includes(String(year))),
  );

  if (!resource) throw new Error(`No CKAN datastore resource found for Belo Horizonte ${year}`);

  const rows: CkanRow[] = [];
  for (let offset = 0; ; offset += 1_000) {
    const page = await fetchJson<CkanRecordsResponse>(
      `https://dados.pbh.gov.br/api/3/action/datastore_search?resource_id=${encodeURIComponent(resource.id)}&limit=1000&offset=${offset}`,
    );
    rows.push(...page.result.records);
    if (page.result.records.length < 1_000) break;
  }

  return normaliseBeloHorizonteRows(rows, year, resource.url);
}

export function normaliseBeloHorizonteRows(
  rows: CkanRow[],
  year: number,
  sourceUrl: string,
): MunicipalExpenseDelivery {
  return {
    recipient: {
      key: "belo-horizonte",
      name: "Belo Horizonte",
      state: "MG",
      municipalityIbgeCode: "3106200",
    },
    sourceLabel: SOURCE_LABEL,
    ...period(rows, year),
    knownGaps: [
      "A base aberta não prova, por si só, que a despesa foi paga com uma emenda federal.",
      "Anulações e a chave de junção entre bases ainda precisam de validação antes de somar totais.",
    ],
    expenses: rows.flatMap((row) => normaliseRow(row, year, sourceUrl)),
  };
}

function normaliseRow(
  row: CkanRow,
  year: number,
  sourceUrl: string,
): MunicipalExpense[] {
  const paid = money(field(row, "Valor Pago", "vl_pago"));
  const liquidated = money(field(row, "Valor Liquidado", "vl_liquidado"));
  const amount = nonZero(paid) ?? nonZero(liquidated);
  if (!amount) return [];

  const recordId = text(field(row, "_id", "id"));
  const sourceId = recordId ? `bh:${year}:${recordId}` : `bh:${year}:${rowFingerprint(row)}`;
  const supplierName = text(field(row, "Nome Credor", "Credor")) || "Não informado";

  return [{
    sourceId,
    supplierName,
    supplierDocument: cnpj(field(row, "CPF/CNPJ Credor", "Num Documento Credor")),
    description: text(field(row, "Descrição Empenho", "Histórico", "Item Despesa", "Ação")),
    amount,
    spentAt: date(field(row, "Data Pagamento", "Data Liquidação", "Dt Movimento")),
    liquidationId: text(field(row, "Número Liquidação")),
    paymentId: text(field(row, "Número Ordem de Pagamento")),
    sourceUrl,
    sourceLabel: SOURCE_LABEL,
    federalAmendmentCode: explicitFederalAmendmentCode(row),
  }];
}

function nonZero(value: string | null) {
  return value && Number(value) !== 0 ? value : null;
}

function explicitFederalAmendmentCode(row: CkanRow): string | null {
  for (const [key, value] of Object.entries(row)) {
    const normalisedKey = key.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
    if (normalisedKey.includes("emenda federal")) return text(value);
  }
  return null;
}

function period(rows: CkanRow[], year: number): Pick<MunicipalExpenseDelivery, "periodStart" | "periodEnd"> {
  const dates = rows
    .map((row) => date(field(row, "Dt Movimento", "Data Pagamento", "Data Liquidação")))
    .filter((value): value is string => Boolean(value))
    .sort();
  return dates.length ? { periodStart: dates[0], periodEnd: dates.at(-1)! } : { periodStart: `${year}-01-01`, periodEnd: `${year}-12-31` };
}

function rowFingerprint(row: CkanRow): string {
  const stableRow = Object.entries(row).sort(([left], [right]) => left.localeCompare(right));
  let hash = 5381;
  for (const character of JSON.stringify(stableRow)) hash = (hash * 33) ^ character.charCodeAt(0);
  return String(hash >>> 0);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; Emenda/0.1; transparencia@emenda.org)" } });
  if (!response.ok) throw new Error(`Belo Horizonte CKAN request failed: ${response.status}`);
  return response.json() as Promise<T>;
}
