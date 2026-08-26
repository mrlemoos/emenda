import { describe, expect, it } from "vitest";
import { sumBy } from "./reconcile";

describe("sumBy", () => {
  it("soma pagamentos sem misturar emendas", () => {
    const rows = [
      { amendment: 1, amount: 10 },
      { amendment: 1, amount: 15 },
      { amendment: 2, amount: 8 },
    ];

    expect(sumBy(rows, (row) => row.amendment, (row) => row.amount)).toEqual(
      new Map([
        [1, 25],
        [2, 8],
      ]),
    );
  });
});
