import { describe, expect, it } from "vitest";
import { normaliseBeloHorizonteRows } from "./belo-horizonte";

describe("despesas públicas de Belo Horizonte", () => {
  it("normaliza credor, fases financeiras e só aceita emenda federal declarada", () => {
    const result = normaliseBeloHorizonteRows([
      {
        "Número Empenho": "2026NE0001",
        "Número Liquidação": "2026LI0001",
        "Número Ordem de Pagamento": "2026OP0001",
        "Nome Credor": "Fornecedor BH LTDA",
        "CPF/CNPJ Credor": "12.345.678/0001-90",
        "Histórico": "Material escolar",
        "Data Pagamento": "15/02/2026",
        "Valor Pago": "1.234,56",
        "Número Emenda Federal": "2026.12345",
      },
      {
        "Número Empenho": "2026NE0002",
        "Nome Credor": "Pessoa física",
        "CPF/CNPJ Credor": "123.456.789-09",
        "Data Liquidação": "2026-03-02",
        "Valor Liquidado": "10.00",
        "Número Emenda": "42",
      },
    ], 2026, "https://dados.pbh.gov.br/arquivo.csv");

    expect(result.recipient).toMatchObject({ key: "belo-horizonte", state: "MG" });
    expect(result.expenses).toEqual([
      expect.objectContaining({
        supplierName: "Fornecedor BH LTDA",
        supplierDocument: "12345678000190",
        amount: "1234.56",
        spentAt: "2026-02-15",
        liquidationId: "2026LI0001",
        paymentId: "2026OP0001",
        federalAmendmentCode: "2026.12345",
      }),
      expect.objectContaining({
        supplierDocument: null,
        amount: "10.00",
        spentAt: "2026-03-02",
        federalAmendmentCode: null,
      }),
    ]);
  });
});
