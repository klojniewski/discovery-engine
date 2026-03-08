import { callClaude } from "./anthropic";

const TEMPLATE_TYPES = [
  "homepage",
  "landing_page",
  "blog_post",
  "blog_listing",
  "product_page",
  "product_listing",
  "case_study",
  "about_page",
  "team_page",
  "contact_page",
  "legal_page",
  "documentation_page",
  "resource_page",
  "service_page",
  "custom_page",
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export type ContentTier = "must_migrate" | "improve" | "consolidate" | "archive";

interface PageInput {
  url: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number | null;
  contentPreview: string | null;
  isDuplicate?: boolean;
}

interface ClassifyAndScoreResult {
  url: string;
  templateType: TemplateType;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  tier: ContentTier;
  tierReasoning: string;
}

/**
 * Classify template type AND score content tier in a single API call per batch.
 * Batches of 10 pages. Duplicates are auto-scored as "consolidate" without API call.
 */
export async function classifyAndScorePages(
  pages: PageInput[],
  projectId?: string,
  onProgress?: (completed: number, total: number) => void | Promise<void>
): Promise<ClassifyAndScoreResult[]> {
  // Handle duplicates locally — no need to send to API
  const duplicates = pages.filter((p) => p.isDuplicate);
  const nonDuplicates = pages.filter((p) => !p.isDuplicate);

  const duplicateResults: ClassifyAndScoreResult[] = duplicates.map((p) => ({
    url: p.url,
    templateType: "custom_page" as TemplateType,
    confidence: "low" as const,
    reasoning: "Duplicate content — classified by URL pattern only",
    tier: "consolidate" as ContentTier,
    tierReasoning: "Duplicate content detected (same content hash as another page)",
  }));

  // Classify duplicates by URL pattern at least
  for (const result of duplicateResults) {
    result.templateType = guessTemplateFromUrl(result.url);
    result.confidence = "medium";
  }

  if (nonDuplicates.length === 0) return duplicateResults;

  const aiResults: ClassifyAndScoreResult[] = [];
  for (let i = 0; i < nonDuplicates.length; i += 10) {
    const batch = nonDuplicates.slice(i, i + 10);
    const batchResults = await classifyAndScoreBatch(batch, projectId);
    aiResults.push(...batchResults);
    if (onProgress) {
      await onProgress(duplicates.length + aiResults.length, pages.length);
    }
  }

  return [...duplicateResults, ...aiResults];
}

function guessTemplateFromUrl(url: string): TemplateType {
  try {
    const { pathname } = new URL(url);
    if (pathname === "/" || pathname === "") return "homepage";
    if (/\/blog\/?$/i.test(pathname)) return "blog_listing";
    if (/\/blog\//i.test(pathname)) return "blog_post";
    if (/\/case-stud/i.test(pathname)) return "case_study";
    if (/\/about/i.test(pathname)) return "about_page";
    if (/\/contact/i.test(pathname)) return "contact_page";
    if (/\/team/i.test(pathname)) return "team_page";
    if (/\/services?\//i.test(pathname)) return "service_page";
    if (/\/products?\//i.test(pathname)) return "product_page";
    if (/\/legal|\/privacy|\/terms|\/cookie/i.test(pathname)) return "legal_page";
    return "custom_page";
  } catch {
    return "custom_page";
  }
}

async function classifyAndScoreBatch(
  pages: PageInput[],
  projectId?: string
): Promise<ClassifyAndScoreResult[]> {
  const pagesDescription = pages
    .map(
      (p, idx) =>
        `Page ${idx + 1}:
  URL: ${p.url}
  Title: ${p.title ?? "N/A"}
  Description: ${p.metaDescription ?? "N/A"}
  Word count: ${p.wordCount ?? "N/A"}
  Content preview: ${(p.contentPreview ?? "").slice(0, 500)}`
    )
    .join("\n\n");

  const prompt = `Analyze each webpage and provide BOTH a template classification AND a content migration tier.

TEMPLATE TYPES: ${TEMPLATE_TYPES.join(", ")}

CONTENT TIERS:
- "must_migrate": High-value pages critical to the business — homepage, key service/product pages, case studies, about pages, team pages, pricing. Content that drives conversions or establishes authority.
- "improve": Pages worth keeping but need work — thin landing pages, outdated content, pages with poor structure. They have potential value but aren't migration-ready as-is.
- "archive": Low-value pages to drop or redirect — legal boilerplate (cookies/privacy), empty/placeholder pages, outdated job postings, utility pages with no SEO or business value.

GUIDELINES:
- Use URL patterns (e.g. /case-studies/ → case_study, /blog/ → blog_post, / alone → homepage) and content to classify templates. Don't use custom_page unless nothing else fits.
- Judge content tier by VALUE, not metadata formatting. A 3000-word case study beats a 500-word cookies policy.
- Blog posts with substantial content (500+ words) are usually must_migrate.
- Legal/policy pages are almost always archive.
- Pages with very few words (<50) and no clear purpose are archive.

Pages to analyze:
${pagesDescription}

Return a JSON array with exactly ${pages.length} objects:
- "url": the exact URL
- "templateType": one of the template types listed
- "confidence": "high", "medium", or "low"
- "reasoning": one sentence on why this template type
- "tier": one of "must_migrate", "improve", "archive"
- "tierReasoning": one sentence on why this tier`;

  const response = await callClaude(prompt, {
    usage: { projectId, step: "classification" },
  });

  try {
    const cleaned = response.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);
    return (Array.isArray(parsed) ? parsed : []).map((item: Record<string, string>) => ({
      url: item.url,
      templateType: TEMPLATE_TYPES.includes(item.templateType as TemplateType)
        ? (item.templateType as TemplateType)
        : "custom_page",
      confidence: (["high", "medium", "low"].includes(item.confidence)
        ? item.confidence
        : "low") as "high" | "medium" | "low",
      reasoning: item.reasoning ?? "",
      tier: (["must_migrate", "improve", "consolidate", "archive"].includes(item.tier)
        ? item.tier
        : "improve") as ContentTier,
      tierReasoning: item.tierReasoning ?? "",
    }));
  } catch {
    console.error("Failed to parse classification+scoring response:", response);
    return pages.map((p) => ({
      url: p.url,
      templateType: "custom_page" as TemplateType,
      confidence: "low" as const,
      reasoning: "Classification failed",
      tier: "improve" as ContentTier,
      tierReasoning: "Scoring failed — defaulting to improve",
    }));
  }
}

// Keep legacy exports for backward compatibility
export async function classifyPages(
  pages: PageInput[],
  projectId?: string
) {
  const results = await classifyAndScorePages(pages, projectId);
  return results.map((r) => ({
    url: r.url,
    templateType: r.templateType,
    confidence: r.confidence,
    reasoning: r.reasoning,
  }));
}
