import { describe, expect, it } from "vitest";
import { normaliseRecifeRows } from "./recife";

describe("despesas públicas do Recife", () => {
  it("normaliza despesa por credor sem inventar vínculo com emenda", () => {
    const result = normaliseRecifeRows([
      {
        "Nome do Credor": "Fornecedor Recife SA",
        "CPF/CNPJ": "98.765.432/0001-10",
        "Data do Empenho": "01/04/2026",
        "Data de Pagamento": "10/04/2026",
        Pagamento: "850,00",
        Liquidação: "900,00",
        Órgão: "Saúde",
      },
      {
        "Nome do Credor": "Outro fornecedor",
        "CPF/CNPJ": "123.456.789-09",
        "Data do Empenho": "2026-05-01",
        Pagamento: "",
        Liquidação: "25.10",
      },
    ], 2026, "https://dados.recife.pe.gov.br/arquivo.csv");

    expect(result.recipient).toMatchObject({ key: "recife", state: "PE" });
    expect(result.knownGaps).toContain("A base por credor não declara fonte de recurso nem emenda federal");
    expect(result.expenses).toEqual([
      expect.objectContaining({
        supplierName: "Fornecedor Recife SA",
        supplierDocument: "98765432000110",
        amount: "850.00",
        spentAt: "2026-04-10",
        federalAmendmentCode: null,
      }),
      expect.objectContaining({ supplierDocument: null, amount: "25.10", spentAt: "2026-05-01" }),
    ]);
  });
});
