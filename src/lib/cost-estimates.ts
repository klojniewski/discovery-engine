const PRICING = {
  haiku: { input: 0.80, output: 4.00 }, // per 1M tokens
  sonnet: { input: 3.00, output: 15.00 },
};

/**
 * Combined classification + scoring in a single API call per batch.
 * ~500 input tokens per page (URL, title, description, 500 chars of content)
 * ~150 output tokens per page (template type + tier + two reasoning strings)
 * Batches of 10, duplicates handled locally (no API call).
 */
export function estimateClassificationAndScoringCost(pageCount: number): number {
  const inputTokens = pageCount * 500;
  const outputTokens = pageCount * 150;
  return (inputTokens * PRICING.haiku.input + outputTokens * PRICING.haiku.output) / 1_000_000;
}

export function estimateSectionDetectionCost(pageCount: number): number {
  // ~2000 input tokens per page (image + prompt), ~500 output
  const inputTokens = pageCount * 2000;
  const outputTokens = pageCount * 500;
  return (inputTokens * PRICING.sonnet.input + outputTokens * PRICING.sonnet.output) / 1_000_000;
}

export function formatCost(cost: number): string {
  if (cost < 0.01) return "<$0.01";
  return `~$${cost.toFixed(2)}`;
}
