import { describe, expect, it } from "vitest";
import {
  createMemoryFiscalStore,
  getPublicCoverage,
  getPublicGastos,
  ingestAuthorizedDelivery,
  type AuthorizedFiscalDelivery,
} from "./index";

const SP_CNPJ = "46395000000139";
const FLORIPA_CNPJ = "82892267000105";
const OUTSIDER_CNPJ = "00000000000191";

function spDelivery(overrides: Partial<AuthorizedFiscalDelivery> = {}): AuthorizedFiscalDelivery {
  return {
    deliveryId: "sp-capital-lote-1",
    recipientScope: {
      recipientKey: "sp-capital",
      name: "São Paulo",
      state: "SP",
      municipalityIbgeCode: "3550308",
      authorizedTakerDocuments: [SP_CNPJ],
    },
    coverage: {
      source: "adn_nfse",
      sourceLabel: "Ambiente de Dados Nacional NFS-e",
      periodStart: "2025-12-22",
      periodEnd: "2026-08-01",
      knownGaps: [
        "Capital paulista mantém emissor próprio; ADN recebe transcrição, não substitui a Nota Fiscal Paulistana",
      ],
    },
    nsuCursor: { source: "adn_nfse", lastNsu: "99" },
    officialLinks: [{ documentSourceId: "sp-nfe-1", amendmentCode: "2026.55555" }],
    documents: [
      {
        sourceId: "sp-nfe-1",
        proofType: "nfe",
        accessKey: "35260146395000000139550010000000011000000010",
        status: "autorizada",
        supplierName: "Fornecedor Paulista LTDA",
        supplierDocument: "11222333000181",
        description: "Material hospitalar",
        amount: "8800.00",
        issuedAt: "2026-04-02",
        takerDocument: SP_CNPJ,
        liquidationId: "liq-sp-1",
        paymentId: "pag-sp-1",
        sourceUrl: "https://exemplo.local/sp-nfe-1",
      },
      {
        sourceId: "sp-fora-escopo-1",
        proofType: "nfe",
        status: "autorizada",
        supplierName: "Outro Município SA",
        amount: "10.00",
        issuedAt: "2026-02-01",
        takerDocument: OUTSIDER_CNPJ,
      },
    ],
    ...overrides,
  };
}

function floripaCursorDelivery(): AuthorizedFiscalDelivery {
  return {
    deliveryId: "floripa-cursor-lote",
    recipientScope: {
      recipientKey: "floripa",
      name: "Florianópolis",
      state: "SC",
      authorizedTakerDocuments: [FLORIPA_CNPJ],
    },
    coverage: {
      source: "adn_nfse",
      sourceLabel: "Ambiente de Dados Nacional NFS-e",
      periodStart: "2025-12-01",
      periodEnd: "2026-08-01",
      knownGaps: [],
    },
    nsuCursor: { source: "adn_nfse", lastNsu: "42" },
    officialLinks: [],
    documents: [
      {
        sourceId: "floripa-cursor-nfe",
        proofType: "nfe",
        status: "autorizada",
        supplierName: "Fornecedor Floripa",
        amount: "1.00",
        issuedAt: "2026-01-01",
        takerDocument: FLORIPA_CNPJ,
      },
    ],
  };
}

describe("ingestão fiscal de São Paulo capital", () => {
  it("publica cobertura própria com UF SP e rejeita tomador fora do escopo", async () => {
    const store = createMemoryFiscalStore();
    store.seedAmendment({
      code: "2026.55555",
      recipientKey: "sp-capital",
      recipientName: "São Paulo",
    });

    const municipalCoverageDelivery: AuthorizedFiscalDelivery = {
      ...spDelivery({
        deliveryId: "sp-capital-paulistana-1",
        coverage: {
          source: "exportacao_municipal",
          sourceLabel: "Nota Fiscal Paulistana",
          periodStart: "2020-01-01",
          periodEnd: "2026-08-01",
          knownGaps: [
            "Emissor nacional obrigatório só para parte dos contribuintes a partir de 2026; histórico permanece no sistema municipal",
          ],
        },
        nsuCursor: undefined,
        officialLinks: [],
        documents: [
          {
            sourceId: "sp-nfse-mun-1",
            proofType: "nfse_municipal",
            accessKey: "NFP-SP-0001",
            status: "autorizada",
            supplierName: "Serviços da Sé ME",
            amount: "410.00",
            issuedAt: "2024-03-01",
            takerDocument: SP_CNPJ,
          },
        ],
      }),
    };

    const first = await ingestAuthorizedDelivery(spDelivery(), store);
    expect(first.accepted).toBe(1);
    expect(first.rejected).toEqual([
      { sourceId: "sp-fora-escopo-1", reason: "Destinatário ou tomador fora do escopo autorizado" },
    ]);
    expect(first.cursor).toEqual({ source: "adn_nfse", lastNsu: "99" });

    await ingestAuthorizedDelivery(municipalCoverageDelivery, store);

    const gastos = getPublicGastos(store, { recipientKey: "sp-capital" });
    expect(gastos.map((gasto) => gasto.id).sort()).toEqual(["sp-nfe-1", "sp-nfse-mun-1"]);
    expect(gastos.find((gasto) => gasto.id === "sp-nfe-1")?.link).toMatchObject({
      kind: "confirmed",
      amendmentCode: "2026.55555",
    });

    const coverage = getPublicCoverage(store, "sp-capital");
    expect(coverage).toMatchObject({
      recipientKey: "sp-capital",
      recipientName: "São Paulo",
      state: "SP",
    });
    expect(coverage?.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "adn_nfse",
          periodStart: "2025-12-22",
          knownGaps: [
            "Capital paulista mantém emissor próprio; ADN recebe transcrição, não substitui a Nota Fiscal Paulistana",
          ],
        }),
        expect.objectContaining({
          source: "exportacao_municipal",
          sourceLabel: "Nota Fiscal Paulistana",
        }),
      ]),
    );
  });

  it("isola cursor NSU e cobertura de Florianópolis", async () => {
    const store = createMemoryFiscalStore();
    await ingestAuthorizedDelivery(floripaCursorDelivery(), store);
    await ingestAuthorizedDelivery(spDelivery(), store);

    expect(store.getCursor("adn_nfse", "floripa")).toBe("42");
    expect(store.getCursor("adn_nfse", "sp-capital")).toBe("99");
    expect(getPublicCoverage(store, "floripa")?.recipientName).toBe("Florianópolis");
    expect(getPublicCoverage(store, "floripa")?.state).toBe("SC");
    expect(getPublicGastos(store, { recipientKey: "floripa" }).map((gasto) => gasto.id)).toEqual([
      "floripa-cursor-nfe",
    ]);
    expect(getPublicGastos(store, { recipientKey: "sp-capital" }).map((gasto) => gasto.id)).toEqual([
      "sp-nfe-1",
    ]);
  });
});
