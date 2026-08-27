import { describe, expect, it } from "vitest";
import { prepareMunicipalExpenseDelivery } from "./municipal-expenses";

describe("gastos municipais públicos", () => {
  it("normaliza a execução, protege CPF e só confirma emenda federal declarada", () => {
    const result = prepareMunicipalExpenseDelivery({
      recipient: { key: "belo-horizonte", name: "Belo Horizonte", state: "MG", municipalityIbgeCode: "3106200" },
      sourceLabel: "Dados Abertos PBH",
      periodStart: "2026-01-01",
      periodEnd: "2026-01-31",
      knownGaps: ["Dados de nota fiscal não estão nesta fonte"],
      expenses: [
        {
          sourceId: "despesa-1",
          supplierName: "Fornecedor A",
          supplierDocument: "12.345.678/0001-90",
          description: "Material",
          amount: "120.00",
          spentAt: "2026-01-20",
          liquidationId: "liq-1",
          paymentId: "pag-1",
          sourceUrl: "https://dados.pbh.gov.br/despesa-1",
          sourceLabel: "Dados Abertos PBH",
          federalAmendmentCode: "2026.12345",
        },
        {
          sourceId: "despesa-2",
          supplierName: "Pessoa Física",
          supplierDocument: "123.456.789-09",
          description: null,
          amount: "10.00",
          spentAt: null,
          liquidationId: null,
          paymentId: null,
          sourceUrl: "https://dados.pbh.gov.br/despesa-2",
          sourceLabel: "Dados Abertos PBH",
          federalAmendmentCode: null,
        },
      ],
    });

    expect(result.gastos).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceId: "belo-horizonte:despesa-1",
          proofType: "execucao_orcamentaria",
          proofStatus: "registrado",
          supplierDocument: "12345678000190",
          spentAt: "2026-01-20",
        }),
        expect.objectContaining({
          sourceId: "belo-horizonte:despesa-2",
          supplierDocument: null,
          spentAt: "2026-01-31",
        }),
      ]),
    );
    expect(result.links).toEqual([
      expect.objectContaining({ gastoSourceId: "belo-horizonte:despesa-1", amendmentCode: "2026.12345", kind: "confirmed" }),
    ]);
  });
});
