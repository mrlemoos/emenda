export type {
  AuthorizedFiscalDelivery,
  CoverageSource,
  FiscalDocumentInput,
  FiscalStore,
  IngestRejection,
  IngestResult,
  LinkKind,
  NormalizedGasto,
  PersistDeliveryInput,
  ProbableHints,
  ProofStatus,
  ProofType,
  PublicCoverage,
  PublicGasto,
  SeedAmendment,
  StoredLink,
} from "./types";

export { createMemoryFiscalStore, fiscalCursorKey } from "./memory-store";
export { ingestAuthorizedDelivery } from "./ingest";
export { getPublicCoverage, getPublicGastos, publicGastosCsv, type PublicGastoFilters } from "./public";
export { normalizeDocument } from "./normalize";
export { buildLinks } from "./link";
export {
  getSourceCursor,
  ingestAuthorizedDeliveryToDb,
  ingestMunicipalExpenseDeliveryToDb,
  loadCoverageFromDb,
  loadPublicGastosFromDb,
} from "./db-store";
