export type MunicipalExpense = {
  sourceId: string;
  supplierName: string;
  supplierDocument: string | null;
  description: string | null;
  amount: string;
  spentAt: string | null;
  liquidationId: string | null;
  paymentId: string | null;
  sourceUrl: string;
  sourceLabel: string;
  /** Only a code the municipal source explicitly identifies as a federal parliamentary amendment. */
  federalAmendmentCode: string | null;
};

export type MunicipalExpenseDelivery = {
  recipient: {
    key: string;
    name: string;
    state: string;
    municipalityIbgeCode: string;
  };
  sourceLabel: string;
  periodStart: string;
  periodEnd: string;
  knownGaps: string[];
  expenses: MunicipalExpense[];
};
