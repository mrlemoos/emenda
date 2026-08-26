import { buildLinks } from "./link";
import { normalizeDocument } from "./normalize";
import type { AuthorizedFiscalDelivery, FiscalStore, IngestResult, NormalizedGasto } from "./types";

const OUT_OF_SCOPE = "Destinatário ou tomador fora do escopo autorizado";

export async function ingestAuthorizedDelivery(
  delivery: AuthorizedFiscalDelivery,
  store: FiscalStore,
): Promise<IngestResult> {
  const authorized = new Set(
    delivery.recipientScope.authorizedTakerDocuments.map((document) => normalizeDocumentId(document)),
  );
  const rejected: IngestResult["rejected"] = [];
  const acceptedDocs = delivery.documents.filter((document) => {
    const allowed = authorized.has(normalizeDocumentId(document.takerDocument));
    if (!allowed) {
      rejected.push({ sourceId: document.sourceId, reason: OUT_OF_SCOPE });
      return false;
    }
    return true;
  });

  const gastos: NormalizedGasto[] = acceptedDocs.map((document) =>
    normalizeDocument(document, {
      recipientKey: delivery.recipientScope.recipientKey,
      sourceLabel: delivery.coverage.sourceLabel,
      coverageSource: delivery.coverage.source,
    }),
  );

  const acceptedSourceIds = new Set(gastos.map((gasto) => gasto.sourceId));
  const links = buildLinks(delivery, acceptedSourceIds, store.listLinks());
  const syncedAt = new Date().toISOString();

  await store.persistDelivery({
    recipientKey: delivery.recipientScope.recipientKey,
    recipientName: delivery.recipientScope.name,
    state: delivery.recipientScope.state,
    municipalityIbgeCode: delivery.recipientScope.municipalityIbgeCode,
    authorizedTakerDocuments: delivery.recipientScope.authorizedTakerDocuments,
    coverage: delivery.coverage,
    syncedAt,
    gastos,
    links,
    cursor: delivery.nsuCursor,
  });

  return {
    accepted: gastos.length,
    rejected,
    cursor: delivery.nsuCursor ?? null,
  };
}

function normalizeDocumentId(value: string) {
  return value.replace(/\D/g, "");
}
