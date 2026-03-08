import { callClaudeWithImage } from "./anthropic";
import type { UsageContext } from "./anthropic";
import type { PageSection } from "@/types/page-sections";
import { parsePageSections } from "@/types/page-sections";
import { extractHtmlSections, formatHtmlSectionsForPrompt } from "./html-sections";

export async function detectPageSections(
  screenshotUrl: string,
  pageUrl: string,
  rawHtml?: string | null,
  sectionTypes?: SectionTypeForPrompt[],
  usage?: UsageContext
): Promise<PageSection[]> {
  // Extract HTML structure if available
  const htmlSections = rawHtml ? extractHtmlSections(rawHtml) : [];
  const htmlContext = htmlSections.length > 0
    ? formatHtmlSectionsForPrompt(htmlSections)
    : "";

  const validSlugs = sectionTypes?.map((st) => st.slug);

  // callClaudeWithImage handles resizing (max 7900px) and returns actual dimensions sent
  // We use a placeholder height in the prompt, then fix it with the real meta below
  const { text: response, meta } = await callClaudeWithImage(
    buildSectionPrompt(pageUrl, htmlContext, 0, sectionTypes),
    screenshotUrl,
    { model: "claude-sonnet-4-6", returnMeta: true, usage: { ...usage, step: usage?.step ?? "sections" } }
  );

  // Use the actual image height (post-resize) for coordinate conversion
  const imageHeight = meta.height;

  try {
    const cleaned = response.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);

    // Convert pixel coordinates to percentages before parsing
    if (Array.isArray(parsed) && imageHeight > 0) {
      for (const item of parsed) {
        if (item && typeof item === "object") {
          if (typeof item.yStartPx === "number") {
            item.yStartPercent = (item.yStartPx / imageHeight) * 100;
          }
          if (typeof item.yEndPx === "number") {
            item.yEndPercent = (item.yEndPx / imageHeight) * 100;
          }
        }
      }
    }

    const sections = parsePageSections(parsed, validSlugs);

    if (sections.length === 0) {
      throw new Error("AI returned no valid sections");
    }

    return sections;
  } catch (err) {
    console.error("Failed to parse page sections response:", response);
    throw new Error(
      `Section detection failed: ${err instanceof Error ? err.message : "could not parse AI response"}`
    );
  }
}

interface SectionTypeForPrompt {
  slug: string;
  category: string;
  description: string | null;
}

function formatTaxonomyForPrompt(sectionTypes: SectionTypeForPrompt[]): string {
  const grouped = new Map<string, SectionTypeForPrompt[]>();
  for (const st of sectionTypes) {
    const group = grouped.get(st.category) ?? [];
    group.push(st);
    grouped.set(st.category, group);
  }

  const lines: string[] = [];
  for (const [category, types] of grouped) {
    const entries = types.map((t) =>
      t.description ? `${t.slug} — ${t.description}` : t.slug
    );
    lines.push(`${category}: ${entries.join(", ")}`);
  }
  return lines.join("\n");
}

function buildSectionPrompt(
  pageUrl: string,
  htmlContext: string,
  imageHeight: number,
  sectionTypes?: SectionTypeForPrompt[]
): string {
  const htmlBlock = htmlContext
    ? `\n\n${htmlContext}\n\nUse the HTML structure above to guide your section boundaries. Each visual section on the screenshot should correspond to one or more of these HTML elements. This helps you identify exact boundaries between sections.`
    : "";

  const heightInfo = imageHeight > 0
    ? `\n\nThe image is ${imageHeight}px tall. Your yEndPx values must not exceed ${imageHeight}.`
    : "";

  const taxonomyBlock = sectionTypes && sectionTypes.length > 0
    ? `\n\nSECTION TYPE TAXONOMY — use these slugs for the sectionType field:\n\n${formatTaxonomyForPrompt(sectionTypes)}\n\nIf a section does not match any slug above, set sectionType to null.`
    : "";

  return `Analyze this full-page screenshot and split it into horizontal sections from top to bottom.

Page URL: ${pageUrl}${htmlBlock}${heightInfo}${taxonomyBlock}

For each section (horizontal band of the page), provide:
- sectionLabel: a short human-readable name (e.g., "Navigation Bar", "Hero Banner", "Feature Cards")
- sectionType: the matching slug from the taxonomy above, or null if no match
- yStartPx: the Y pixel coordinate where this section starts (top edge of its visual content)
- yEndPx: the Y pixel coordinate where this section ends (bottom edge of its visual content)
- components: an array of UI components within that section, each with:
  - type: the taxonomy slug that best describes this component (e.g., "hero", "navigation", "testimonials"), or "other"
  - styleDescription: brief visual description (colors, layout, typography, key text)
  - complexity: "simple", "moderate", or "complex"

CRITICAL rules for yStartPx/yEndPx:
- Coordinates are pixels from the top of the image (0 = very top).
- Be PRECISE: each boundary should align exactly with the visual edge where one section's background/content ends and the next begins.
- Look for visual cues: background color changes, horizontal dividers, spacing gaps between content blocks.
- Sections must be contiguous: yEndPx of section N = yStartPx of section N+1.
- First section starts at 0. Last section ends at the image bottom.
- Do NOT split a single visual block (like a hero with heading + subtext + CTA) into multiple sections.

Return a JSON array of sections in top-to-bottom order.

Example:
[
  {"sectionLabel": "Navigation", "sectionType": "navigation", "yStartPx": 0, "yEndPx": 80, "components": [{"type": "navigation", "styleDescription": "Dark header, logo left, links right", "complexity": "moderate"}]},
  {"sectionLabel": "Hero Banner", "sectionType": "hero-split", "yStartPx": 80, "yEndPx": 650, "components": [{"type": "hero", "styleDescription": "Text left, image right with CTA button", "complexity": "complex"}]},
  {"sectionLabel": "Custom Widget", "sectionType": null, "yStartPx": 650, "yEndPx": 900, "components": [{"type": "other", "styleDescription": "Interactive calculator tool", "complexity": "complex"}]}
]`;
}
