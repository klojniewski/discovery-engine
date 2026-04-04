const PRICING = {
  haiku: { input: 0.80, output: 4.00 }, // per 1M tokens
  sonnet: { input: 3.00, output: 15.00 },
};

/**
 * New pipeline cost estimate:
 * - Group naming: ~1 Haiku call with ~2000 input + ~1000 output (fixed, negligible)
 * - Singleton classification: ~20% of pages in batches of 10
 * - Tier scoring: all pages in batches of 10
 *
 * ~500 input tokens per page, ~150 output tokens per page.
 */
export function estimateClassificationAndScoringCost(pageCount: number): number {
  // Group naming: fixed cost (~$0.01)
  const groupNamingCost =
    (2000 * PRICING.haiku.input + 1000 * PRICING.haiku.output) / 1_000_000;

  // Singleton classification: ~20% of pages
  const singletonCount = Math.ceil(pageCount * 0.2);
  const singletonCost =
    (singletonCount * 500 * PRICING.haiku.input +
      singletonCount * 150 * PRICING.haiku.output) /
    1_000_000;

  // Tier scoring: all pages
  const tierCost =
    (pageCount * 500 * PRICING.haiku.input +
      pageCount * 150 * PRICING.haiku.output) /
    1_000_000;

  return groupNamingCost + singletonCost + tierCost;
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
