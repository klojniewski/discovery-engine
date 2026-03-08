import { callClaude } from "./anthropic";

export type ContentTier = "must_migrate" | "improve" | "consolidate" | "archive";

interface PageScoringInput {
  url: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number | null;
  contentPreview: string | null;
  isDuplicate: boolean;
}

interface ScoringResult {
  url: string;
  tier: ContentTier;
  reasoning: string;
}

export async function scorePages(
  pages: PageScoringInput[],
  projectId?: string
): Promise<ScoringResult[]> {
  // Mark duplicates immediately
  const duplicates = pages.filter((p) => p.isDuplicate);
  const nonDuplicates = pages.filter((p) => !p.isDuplicate);

  const duplicateResults: ScoringResult[] = duplicates.map((p) => ({
    url: p.url,
    tier: "consolidate" as const,
    reasoning: "Duplicate content detected (same content hash as another page)",
  }));

  if (nonDuplicates.length === 0) return duplicateResults;

  // Batch non-duplicates in groups of 15
  const aiResults: ScoringResult[] = [];
  for (let i = 0; i < nonDuplicates.length; i += 15) {
    const batch = nonDuplicates.slice(i, i + 15);
    const batchResults = await scoreBatch(batch, projectId);
    aiResults.push(...batchResults);
  }

  return [...duplicateResults, ...aiResults];
}

async function scoreBatch(pages: PageScoringInput[], projectId?: string): Promise<ScoringResult[]> {
  const pagesDescription = pages
    .map(
      (p, idx) =>
        `Page ${idx + 1}:
  URL: ${p.url}
  Title: ${p.title ?? "N/A"}
  Meta description: ${p.metaDescription ?? "N/A"}
  Word count: ${p.wordCount ?? "N/A"}
  Content preview: ${(p.contentPreview ?? "").slice(0, 500)}`
    )
    .join("\n\n");

  const prompt = `You are evaluating pages for a website migration audit. Assign each page a content tier based on its VALUE to the business and users.

TIERS:
- "must_migrate": High-value pages critical to the business — homepage, key service/product pages, case studies, about pages, team pages, pricing. Content that drives conversions, establishes authority, or is essential for the site to function.
- "improve": Pages worth keeping but need work — thin landing pages, outdated content, pages with poor structure. They have potential value but aren't migration-ready as-is.
- "archive": Low-value pages to drop or redirect — legal boilerplate (cookies/privacy policies), empty/placeholder pages, outdated job postings, utility pages with no SEO or business value.

GUIDELINES:
- Judge by CONTENT VALUE, not metadata formatting
- A 3000-word case study is always more valuable than a 500-word cookies policy
- Service/product pages are typically must_migrate even if metadata is imperfect
- Blog posts with substantial content (500+ words) are usually must_migrate
- Legal/policy pages (cookies, privacy, terms) are almost always archive
- Pages with very few words (<50) and no clear purpose are archive
- Career/job pages depend on whether they're actively used

Pages to evaluate:
${pagesDescription}

Return a JSON array with exactly ${pages.length} objects:
- "url": the exact URL
- "tier": one of "must_migrate", "improve", "archive"
- "reasoning": one sentence explaining why`;

  const response = await callClaude(prompt, {
    usage: { projectId, step: "scoring" },
  });

  try {
    const cleaned = response
      .replace(/^```(?:json)?\s*\n?/m, "")
      .replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);
    return (Array.isArray(parsed) ? parsed : []).map(
      (item: Record<string, string>) => ({
        url: item.url,
        tier: (["must_migrate", "improve", "consolidate", "archive"].includes(
          item.tier
        )
          ? item.tier
          : "improve") as ContentTier,
        reasoning: item.reasoning ?? "",
      })
    );
  } catch {
    console.error("Failed to parse scoring response:", response);
    return pages.map((p) => ({
      url: p.url,
      tier: "improve" as const,
      reasoning: "Scoring failed — defaulting to improve",
    }));
  }
}
