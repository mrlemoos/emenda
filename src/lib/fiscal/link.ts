import type { AuthorizedFiscalDelivery, FiscalDocumentInput, StoredLink } from "./types";

const CONFIRMED_REASON = "Fonte oficial declara relação entre a emenda e o gasto";

const PROBABLE_REASON_BY_HINT = {
  sameSupplierAsCommitment: "Fornecedor coincide com o empenho da emenda",
  amountMatchesTransfer: "Valor nominal coincide com a transferência no período",
  dateWithinExecutionWindow: "Data cai na janela de execução da emenda",
  sameOrganAsAmendmentRecipient: "Órgão comprador coincide com o recebedor da emenda",
} as const;

export function buildLinks(
  delivery: AuthorizedFiscalDelivery,
  acceptedSourceIds: Set<string>,
  previousLinks: StoredLink[],
): StoredLink[] {
  const previousByGasto = new Map(previousLinks.map((link) => [link.gastoSourceId, link]));
  const links: StoredLink[] = [];
  const claimed = new Set<string>();

  for (const official of delivery.officialLinks) {
    if (!acceptedSourceIds.has(official.documentSourceId)) continue;
    const previous = previousByGasto.get(official.documentSourceId);
    links.push({
      gastoSourceId: official.documentSourceId,
      amendmentCode: official.amendmentCode,
      kind: "confirmed",
      reasons: [CONFIRMED_REASON],
      previousReasons: previous && previous.reasons.join("|") !== CONFIRMED_REASON ? previous.reasons : previous?.previousReasons ?? null,
    });
    claimed.add(official.documentSourceId);
  }

  for (const document of delivery.documents) {
    if (!acceptedSourceIds.has(document.sourceId) || claimed.has(document.sourceId)) continue;
    const probable = probableLinkFor(document);
    if (!probable) continue;
    const previous = previousByGasto.get(document.sourceId);
    links.push({
      ...probable,
      previousReasons:
        previous && previous.reasons.join("|") !== probable.reasons.join("|")
          ? previous.reasons
          : previous?.previousReasons ?? null,
    });
  }

  return links;
}

function probableLinkFor(document: FiscalDocumentInput): StoredLink | null {
  if (document.status !== "autorizada") return null;
  if (!document.probableAmendmentCode || !document.probableHints) return null;

  const reasons = (Object.keys(PROBABLE_REASON_BY_HINT) as Array<keyof typeof PROBABLE_REASON_BY_HINT>)
    .filter((hint) => document.probableHints?.[hint])
    .map((hint) => PROBABLE_REASON_BY_HINT[hint]);

  if (!reasons.length) return null;

  return {
    gastoSourceId: document.sourceId,
    amendmentCode: document.probableAmendmentCode,
    kind: "probable",
    reasons,
    previousReasons: null,
  };
}
