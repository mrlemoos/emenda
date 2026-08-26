import type {
  AuthorizedFiscalDelivery,
  FiscalStore,
  NormalizedGasto,
  PublicCoverage,
  SeedAmendment,
  StoredLink,
} from "./types";

type CoverageRow = {
  recipientKey: string;
  recipientName: string;
  source: AuthorizedFiscalDelivery["coverage"]["source"];
  sourceLabel: string;
  periodStart: string;
  periodEnd: string;
  knownGaps: string[];
  lastSyncedAt: string;
};

export function createMemoryFiscalStore(): FiscalStore {
  const amendments = new Map<string, SeedAmendment>();
  const gastos = new Map<string, NormalizedGasto>();
  const links = new Map<string, StoredLink>();
  const coverages = new Map<string, CoverageRow>();
  const cursors = new Map<string, string>();
  let failPersist = false;

  return {
    seedAmendment(amendment) {
      amendments.set(amendment.code, amendment);
    },
    failNextPersist() {
      failPersist = true;
    },
    getCursor(source) {
      return cursors.get(source) ?? null;
    },
    async persistDelivery(input) {
      if (failPersist) {
        failPersist = false;
        throw new Error("gravação do lote falhou");
      }

      for (const gasto of input.gastos) {
        gastos.set(gasto.sourceId, gasto);
      }

      for (const link of input.links) {
        links.set(link.gastoSourceId, link);
      }

      const coverageKey = `${input.recipientKey}:${input.coverage.source}`;
      coverages.set(coverageKey, {
        recipientKey: input.recipientKey,
        recipientName: input.recipientName,
        source: input.coverage.source,
        sourceLabel: input.coverage.sourceLabel,
        periodStart: input.coverage.periodStart,
        periodEnd: input.coverage.periodEnd,
        knownGaps: input.coverage.knownGaps,
        lastSyncedAt: input.syncedAt,
      });

      if (input.cursor) {
        cursors.set(input.cursor.source, input.cursor.lastNsu);
      }
    },
    listGastos() {
      return [...gastos.values()];
    },
    listLinks() {
      return [...links.values()];
    },
    getCoverage(recipientKey) {
      const sources = [...coverages.values()].filter((row) => row.recipientKey === recipientKey);
      if (!sources.length) return null;
      return {
        recipientKey,
        recipientName: sources[0].recipientName,
        sources: sources.map((row) => ({
          source: row.source,
          sourceLabel: row.sourceLabel,
          periodStart: row.periodStart,
          periodEnd: row.periodEnd,
          lastSyncedAt: row.lastSyncedAt,
          knownGaps: row.knownGaps,
        })),
      } satisfies PublicCoverage;
    },
  };
}
