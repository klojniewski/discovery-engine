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

interface PageInput {
  url: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number | null;
  contentPreview: string | null;
}

interface ClassificationResult {
  url: string;
  templateType: TemplateType;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export async function classifyPages(
  pages: PageInput[],
  projectId?: string
): Promise<ClassificationResult[]> {
  // Batch in groups of 10
  const results: ClassificationResult[] = [];

  for (let i = 0; i < pages.length; i += 10) {
    const batch = pages.slice(i, i + 10);
    const batchResults = await classifyBatch(batch, projectId);
    results.push(...batchResults);
  }

  return results;
}

async function classifyBatch(
  pages: PageInput[],
  projectId?: string
): Promise<ClassificationResult[]> {
  const pagesDescription = pages
    .map(
      (p, idx) =>
        `Page ${idx + 1}:
  URL: ${p.url}
  Title: ${p.title ?? "N/A"}
  Description: ${p.metaDescription ?? "N/A"}
  Word count: ${p.wordCount ?? "N/A"}
  Content preview: ${(p.contentPreview ?? "").slice(0, 300)}`
    )
    .join("\n\n");

  const prompt = `Classify each webpage into one of these template types based on URL pattern, title, and content:
${TEMPLATE_TYPES.join(", ")}

Pages to classify:
${pagesDescription}

IMPORTANT: Look at URL patterns (e.g. /case-studies/ → case_study, /blog/ → blog_post, / alone → homepage) and page titles to determine the type. Be specific — don't use custom_page unless nothing else fits.

Return a JSON array with exactly ${pages.length} objects. Each object must have:
- "url": the exact URL from above
- "templateType": one of the types listed
- "confidence": "high", "medium", or "low"
- "reasoning": one sentence explanation`;

  const response = await callClaude(prompt, {
    usage: { projectId, step: "classification" },
  });

  try {
    // Strip markdown fences if present
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
    }));
  } catch {
    console.error("Failed to parse classification response:", response);
    return pages.map((p) => ({
      url: p.url,
      templateType: "custom_page" as TemplateType,
      confidence: "low" as const,
      reasoning: "Classification failed",
    }));
  }
}
