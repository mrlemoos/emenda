import { describe, expect, it } from "vitest";
import {
  createMemoryFiscalStore,
  getPublicCoverage,
  getPublicGastos,
  ingestAuthorizedDelivery,
  publicGastosCsv,
  type AuthorizedFiscalDelivery,
} from "./index";

const FLORIPA_CNPJ = "82892267000105";
const OUTSIDER_CNPJ = "00000000000191";

function sampleDelivery(overrides: Partial<AuthorizedFiscalDelivery> = {}): AuthorizedFiscalDelivery {
  return {
    deliveryId: "floripa-lote-1",
    recipientScope: {
      recipientKey: "floripa",
      name: "Florianópolis",
      authorizedTakerDocuments: [FLORIPA_CNPJ],
    },
    coverage: {
      source: "adn_nfse",
      sourceLabel: "Ambiente de Dados Nacional NFS-e",
      periodStart: "2025-12-01",
      periodEnd: "2026-08-01",
      knownGaps: ["NFS-e anteriores a 1 de dezembro de 2025 estão na exportação municipal"],
    },
    nsuCursor: { source: "adn_nfse", lastNsu: "42" },
    officialLinks: [{ documentSourceId: "nfe-1", amendmentCode: "2026.12345" }],
    documents: [
      {
        sourceId: "nfe-1",
        proofType: "nfe",
        accessKey: "42260112345678000199550010000000011000000010",
        status: "autorizada",
        supplierName: "Fornecedor Alfa LTDA",
        supplierDocument: "12345678000199",
        description: "Material de expediente",
        amount: "1500.00",
        issuedAt: "2026-03-10",
        takerDocument: FLORIPA_CNPJ,
        liquidationId: "liq-100",
        paymentId: "pag-200",
        sourceUrl: "https://exemplo.local/nfe-1",
        cpf: "529.982.247-25",
        address: "Rua Segredo 1",
        phone: "48999999999",
        email: "pessoa@exemplo.local",
        rawXml: "<nfe>segredo</nfe>",
      },
      {
        sourceId: "nfse-nac-1",
        proofType: "nfse_nacional",
        accessKey: "NFSE420000000000000000000000000000000000000001",
        status: "autorizada",
        supplierName: "Serviços Beta ME",
        supplierDocument: "22345678000188",
        description: "Manutenção predial",
        amount: "3200.50",
        issuedAt: "2026-01-15",
        takerDocument: FLORIPA_CNPJ,
        liquidationId: "liq-101",
        paymentId: "pag-201",
        sourceUrl: "https://exemplo.local/nfse-nac-1",
        probableHints: {
          sameSupplierAsCommitment: true,
          amountMatchesTransfer: true,
          dateWithinExecutionWindow: true,
          sameOrganAsAmendmentRecipient: true,
        },
        probableAmendmentCode: "2026.12345",
      },
      {
        sourceId: "nfse-mun-1",
        proofType: "nfse_municipal",
        accessKey: "PMF-LEGADO-0001",
        status: "cancelada",
        supplierName: "Consultoria Gama",
        supplierDocument: "32345678000177",
        description: "Consultoria técnica",
        amount: "900.00",
        issuedAt: "2024-06-01",
        takerDocument: FLORIPA_CNPJ,
        sourceUrl: "https://exemplo.local/nfse-mun-1",
      },
      {
        sourceId: "fora-escopo-1",
        proofType: "nfe",
        status: "autorizada",
        supplierName: "Outro Município SA",
        amount: "10.00",
        issuedAt: "2026-02-01",
        takerDocument: OUTSIDER_CNPJ,
        rawXml: "<nfe>nao</nfe>",
      },
    ],
    ...overrides,
  };
}

describe("ingestão fiscal de Florianópolis", () => {
  it("publica gastos normalizados com cobertura, vínculos e rejeições sem vazar PII nem XML", async () => {
    const store = createMemoryFiscalStore();
    store.seedAmendment({ code: "2026.12345", recipientKey: "floripa", recipientName: "Florianópolis" });

    const municipalCoverageDelivery: AuthorizedFiscalDelivery = {
      ...sampleDelivery({
        deliveryId: "floripa-legado-1",
        coverage: {
          source: "exportacao_municipal",
          sourceLabel: "Exportação única do emissor municipal antigo",
          periodStart: "2020-01-01",
          periodEnd: "2025-11-30",
          knownGaps: ["Emissor municipal descontinuado após 30 de novembro de 2025"],
        },
        nsuCursor: undefined,
        officialLinks: [],
        documents: [
          {
            sourceId: "nfse-mun-1",
            proofType: "nfse_municipal",
            accessKey: "PMF-LEGADO-0001",
            status: "cancelada",
            supplierName: "Consultoria Gama",
            supplierDocument: "32345678000177",
            description: "Consultoria técnica",
            amount: "900.00",
            issuedAt: "2024-06-01",
            takerDocument: FLORIPA_CNPJ,
            sourceUrl: "https://exemplo.local/nfse-mun-1",
          },
        ],
      }),
    };

    const first = await ingestAuthorizedDelivery(sampleDelivery(), store);
    expect(first.accepted).toBe(3);
    expect(first.rejected).toEqual([
      { sourceId: "fora-escopo-1", reason: "Destinatário ou tomador fora do escopo autorizado" },
    ]);
    expect(first.cursor).toEqual({ source: "adn_nfse", lastNsu: "42" });

    await ingestAuthorizedDelivery(municipalCoverageDelivery, store);

    const gastos = getPublicGastos(store, { amendmentCode: "2026.12345" });
    expect(gastos).toHaveLength(2);

    const confirmed = gastos.find((gasto) => gasto.id === "nfe-1");
    expect(confirmed).toMatchObject({
      supplierName: "Fornecedor Alfa LTDA",
      supplierDocument: "12345678000199",
      description: "Material de expediente",
      spentAt: "2026-03-10",
      amount: "1500.00",
      proofType: "nfe",
      proofStatus: "autorizada",
      proofAccessKey: "42260112345678000199550010000000011000000010",
      liquidationId: "liq-100",
      paymentId: "pag-200",
      link: {
        kind: "confirmed",
        amendmentCode: "2026.12345",
        reasons: ["Fonte oficial declara relação entre a emenda e o gasto"],
      },
    });

    const probable = gastos.find((gasto) => gasto.id === "nfse-nac-1");
    expect(probable?.link).toEqual({
      kind: "probable",
      amendmentCode: "2026.12345",
      reasons: [
        "Fornecedor coincide com o empenho da emenda",
        "Valor nominal coincide com a transferência no período",
        "Data cai na janela de execução da emenda",
        "Órgão comprador coincide com o recebedor da emenda",
      ],
    });
    expect(probable?.proofType).toBe("nfse_nacional");

    const cancelled = getPublicGastos(store, { supplierName: "Consultoria Gama" });
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0]).toMatchObject({
      proofType: "nfse_municipal",
      proofStatus: "cancelada",
      link: null,
    });

    const coverage = getPublicCoverage(store, "floripa");
    expect(coverage).toMatchObject({
      recipientKey: "floripa",
      recipientName: "Florianópolis",
    });
    expect(coverage?.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "adn_nfse",
          periodStart: "2025-12-01",
          periodEnd: "2026-08-01",
          knownGaps: ["NFS-e anteriores a 1 de dezembro de 2025 estão na exportação municipal"],
        }),
        expect.objectContaining({
          source: "exportacao_municipal",
          periodStart: "2020-01-01",
          periodEnd: "2025-11-30",
        }),
      ]),
    );
    expect(coverage?.sources.every((source) => Boolean(source.lastSyncedAt))).toBe(true);

    const serialized = JSON.stringify({ gastos, coverage, first });
    expect(serialized).not.toContain("529.982.247-25");
    expect(serialized).not.toContain("Rua Segredo");
    expect(serialized).not.toContain("48999999999");
    expect(serialized).not.toContain("pessoa@exemplo.local");
    expect(serialized).not.toContain("<nfe>");
    expect(serialized).not.toContain("rawXml");

    const csv = publicGastosCsv(getPublicGastos(store, {}));
    expect(csv).toContain("fornecedor");
    expect(csv).toContain("Fornecedor Alfa LTDA");
    expect(csv).toContain("confirmado");
    expect(csv).toContain("provavel");
    expect(csv).not.toContain("<nfe>");

    const second = await ingestAuthorizedDelivery(sampleDelivery(), store);
    expect(second.accepted).toBe(3);
    expect(getPublicGastos(store, {}).map((gasto) => gasto.id).sort()).toEqual([
      "nfe-1",
      "nfse-mun-1",
      "nfse-nac-1",
    ]);
  });

  it("não avança cursor quando lote falha antes da gravação", async () => {
    const store = createMemoryFiscalStore();
    store.failNextPersist();
    await expect(ingestAuthorizedDelivery(sampleDelivery(), store)).rejects.toThrow("gravação do lote falhou");
    expect(store.getCursor("adn_nfse")).toBeNull();
  });
});
