const API = "https://api-publica.transferegov.gestao.gov.br/especiais";
const PAGE_SIZE = 200;

type Page<T> = {
  data: T[];
  total_pages: number;
  total_items: number;
  page_number: number;
  page_size: number;
};

export type Beneficiary = {
  id_beneficiario: number;
  uf_beneficiario: string;
  nome_beneficiario: string;
  cnpj_beneficiario: string | null;
  id_ente: number | null;
};

export type ActionPlan = {
  id_plano_acao: number;
  id_beneficiario: number;
  codigo_emenda_parlamentar_formatado_plano_acao: string;
  ano_emenda_parlamentar_plano_acao: number;
  codigo_parlamentar_emenda_plano_acao: string | null;
  nome_parlamentar_emenda_plano_acao: string;
  nome_objeto: string | null;
  detalhamento_objeto: string | null;
  situacao_plano_acao: string | null;
  valor_custeio_plano_acao: number | null;
  valor_investimento_plano_acao: number | null;
};

export type Commitment = {
  id_empenho: number;
  id_plano_acao: number;
  valor_empenho: number;
};

export type EligibleDocument = {
  id_dh: number;
  id_empenho: number;
  numero_documento_habil: string | null;
  valor_dh: number;
};

export type PaymentOrder = {
  id_op_ob: number;
  id_dh: number;
  numero_ordem_bancaria: string | null;
  data_emissao_ob: string | null;
  descricao_situacao_op: string | null;
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isPage<T>(value: unknown): value is Page<T> {
  if (!value || typeof value !== "object") return false;
  const page = value as Partial<Page<T>>;
  return (
    Array.isArray(page.data) &&
    typeof page.total_pages === "number" &&
    typeof page.total_items === "number" &&
    typeof page.page_number === "number" &&
    typeof page.page_size === "number"
  );
}

async function fetchPage<T>(table: string, page: number) {
  const url = new URL(`${API}/${table}`);
  url.searchParams.set("pagina", String(page));
  url.searchParams.set("tamanho_da_pagina", String(PAGE_SIZE));

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Emenda/0.1" } });
    if (response.ok) {
      const payload: unknown = await response.json();
      if (!isPage<T>(payload)) throw new Error(`Transferegov ${table}: resposta inválida`);
      return payload;
    }
    if (![429, 500, 502, 503, 504].includes(response.status) || attempt === 4) {
      throw new Error(`Transferegov ${table}: HTTP ${response.status}`);
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    await wait(Number.isFinite(retryAfter) ? retryAfter * 1_000 : 2 ** attempt * 1_000);
  }
  throw new Error(`Transferegov ${table}: tentativas esgotadas`);
}

export async function fetchTable<T>(table: string) {
  const first = await fetchPage<T>(table, 1);
  const rows = [...first.data];
  // ponytail: quatro páginas por lote; reduzir concorrência se a API passar a limitar mais agressivamente.
  for (let page = 2; page <= first.total_pages; page += 4) {
    const pages = Array.from({ length: Math.min(4, first.total_pages - page + 1) }, (_, index) => page + index);
    const results = await Promise.all(pages.map((number) => fetchPage<T>(table, number)));
    for (const result of results) rows.push(...result.data);
    await wait(1_050);
  }
  return rows;
}

export async function sourceUpdatedAt() {
  const response = await fetch(`${API}/data-atualizacao`, {
    headers: { Accept: "application/json", "User-Agent": "Emenda/0.1" },
  });
  if (!response.ok) throw new Error(`Transferegov data-atualizacao: HTTP ${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object") throw new Error("Data da fonte inválida");
  const value = (payload as { data_ultima_atualizacao?: unknown }).data_ultima_atualizacao;
  if (typeof value !== "string") throw new Error("Data da fonte ausente");
  const date = new Date(String(value));
  if (Number.isNaN(date.valueOf())) throw new Error("Data da fonte inválida");
  return date;
}

export const transferegovSourceUrl = `${API}/docs`;
