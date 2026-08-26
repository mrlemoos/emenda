import { describe, expect, it } from "vitest";
import { formatMoney, listSentAmount } from "./format";

describe("listSentAmount", () => {
  it("mostra dinheiro enviado quando houve pagamento", () => {
    expect(listSentAmount(646750, 646750)).toEqual({
      primary: formatMoney(646750),
      secondary: null,
    });
  });

  it("não mostra R$ 0,00 quando só há valor autorizado", () => {
    const view = listSentAmount(0, 248750);
    expect(view.primary).toBe("Sem dinheiro enviado");
    expect(view.primary).not.toContain("0,00");
    expect(view.secondary).toBe(`Autorizado ${formatMoney(248750)}`);
  });
});
