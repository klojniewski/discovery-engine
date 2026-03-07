export type ContentTier =
  | "must_migrate"
  | "improve"
  | "consolidate"
  | "archive";

interface PageScoringInput {
  wordCount: number | null;
  navigationDepth: number | null;
  hasTitle: boolean;
  hasMetaDescription: boolean;
  hasH1: boolean;
  titleLength: number;
  metaDescriptionLength: number;
  isDuplicate: boolean;
  isOrphan: boolean;
}

export function assignContentTier(input: PageScoringInput): ContentTier {
  const {
    wordCount,
    navigationDepth,
    hasTitle,
    hasMetaDescription,
    hasH1,
    titleLength,
    metaDescriptionLength,
    isDuplicate,
    isOrphan,
  } = input;

  // Duplicates always go to consolidate
  if (isDuplicate) {
    return "consolidate";
  }

  const words = wordCount ?? 0;
  const depth = navigationDepth ?? 99;

  // Thin content + deep + poor metadata = archive
  if (words < 300 && depth > 3) {
    return "archive";
  }

  // Check metadata quality
  const hasGoodTitle = hasTitle && titleLength >= 30 && titleLength <= 60;
  const hasGoodDescription =
    hasMetaDescription &&
    metaDescriptionLength >= 120 &&
    metaDescriptionLength <= 160;
  const hasGoodMetadata = hasGoodTitle && hasGoodDescription && hasH1;

  // Substantial content + good metadata + prominent = must migrate
  if (words >= 1000 && hasGoodMetadata && depth <= 2) {
    return "must_migrate";
  }

  // Substantial content but missing some quality signals
  if (words >= 300 && depth <= 3) {
    if (hasGoodMetadata) {
      return "must_migrate";
    }
    return "improve";
  }

  // Thin content but still reachable
  if (words < 300 && depth <= 3) {
    if (isOrphan) {
      return "archive";
    }
    return "improve";
  }

  // Deep pages with content
  if (words >= 300 && depth > 3) {
    return "improve";
  }

  return "archive";
}
