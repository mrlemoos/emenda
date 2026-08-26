export type ProofType = "nfe" | "nfse_nacional" | "nfse_municipal";
export type ProofStatus = "autorizada" | "cancelada" | "substituida";
export type LinkKind = "confirmed" | "probable";
export type CoverageSource =
  | "adn_nfse"
  | "exportacao_municipal"
  | "nfe_distribuicao"
  | "execucao_orcamentaria";

export type ProbableHints = {
  sameSupplierAsCommitment?: boolean;
  amountMatchesTransfer?: boolean;
  dateWithinExecutionWindow?: boolean;
  sameOrganAsAmendmentRecipient?: boolean;
};

export type FiscalDocumentInput = {
  sourceId: string;
  proofType: ProofType;
  accessKey?: string;
  status: ProofStatus;
  supplierName: string;
  supplierDocument?: string;
  description?: string;
  amount: string;
  issuedAt: string;
  takerDocument: string;
  liquidationId?: string;
  paymentId?: string;
  sourceUrl?: string;
  cpf?: string;
  address?: string;
  phone?: string;
  email?: string;
  rawXml?: string;
  probableHints?: ProbableHints;
  probableAmendmentCode?: string;
};

export type AuthorizedFiscalDelivery = {
  deliveryId: string;
  recipientScope: {
    recipientKey: string;
    name: string;
    authorizedTakerDocuments: string[];
  };
  coverage: {
    source: CoverageSource;
    sourceLabel: string;
    periodStart: string;
    periodEnd: string;
    knownGaps: string[];
  };
  nsuCursor?: { source: string; lastNsu: string };
  officialLinks: Array<{ documentSourceId: string; amendmentCode: string }>;
  documents: FiscalDocumentInput[];
};

export type NormalizedGasto = {
  sourceId: string;
  recipientKey: string;
  supplierName: string;
  supplierDocument: string | null;
  description: string | null;
  amount: string;
  spentAt: string;
  proofType: ProofType;
  proofStatus: ProofStatus;
  proofAccessKey: string | null;
  sourceUrl: string | null;
  sourceLabel: string;
  coverageSource: CoverageSource;
  liquidationId: string | null;
  paymentId: string | null;
  fieldSources: {
    supplierName: "nota";
    amount: "nota";
    description: "nota";
    spentAt: "nota";
  };
};

export type StoredLink = {
  gastoSourceId: string;
  amendmentCode: string;
  kind: LinkKind;
  reasons: string[];
  previousReasons: string[] | null;
};

export type PublicGasto = {
  id: string;
  supplierName: string;
  supplierDocument: string | null;
  description: string | null;
  spentAt: string | null;
  amount: string;
  proofType: ProofType;
  proofStatus: ProofStatus;
  proofAccessKey: string | null;
  sourceUrl: string | null;
  sourceLabel: string;
  liquidationId: string | null;
  paymentId: string | null;
  fieldSources: NormalizedGasto["fieldSources"];
  link: {
    kind: LinkKind;
    amendmentCode: string;
    reasons: string[];
  } | null;
};

export type PublicCoverage = {
  recipientKey: string;
  recipientName: string;
  sources: Array<{
    source: CoverageSource;
    sourceLabel: string;
    periodStart: string;
    periodEnd: string;
    lastSyncedAt: string;
    knownGaps: string[];
  }>;
};

export type IngestRejection = { sourceId: string; reason: string };

export type IngestResult = {
  accepted: number;
  rejected: IngestRejection[];
  cursor: { source: string; lastNsu: string } | null;
};

export type SeedAmendment = {
  code: string;
  recipientKey: string;
  recipientName: string;
};

export type PersistDeliveryInput = {
  recipientKey: string;
  recipientName: string;
  authorizedTakerDocuments?: string[];
  coverage: AuthorizedFiscalDelivery["coverage"];
  syncedAt: string;
  gastos: NormalizedGasto[];
  links: StoredLink[];
  cursor?: { source: string; lastNsu: string };
};

export type FiscalStore = {
  seedAmendment(amendment: SeedAmendment): void;
  failNextPersist(): void;
  getCursor(source: string): string | null;
  persistDelivery(input: PersistDeliveryInput): Promise<void>;
  listGastos(): NormalizedGasto[];
  listLinks(): StoredLink[];
  getCoverage(recipientKey: string): PublicCoverage | null;
};
