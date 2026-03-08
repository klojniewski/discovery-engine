import { callClaudeWithImage } from "./anthropic";
import type { PageSection } from "@/types/page-sections";
import { parsePageSections } from "@/types/page-sections";
import { extractHtmlSections, formatHtmlSectionsForPrompt } from "./html-sections";

interface DetectedComponent {
  type: string;
  styleDescription: string;
  position: string;
  complexity: "simple" | "moderate" | "complex";
}

export async function detectComponents(
  screenshotUrl: string,
  pageUrl: string
): Promise<DetectedComponent[]> {
  const prompt = `Analyze this webpage screenshot and identify all distinct UI components/sections.

Page URL: ${pageUrl}

For each component, provide:
- type: one of: hero, navigation, sub_navigation, cta, form, card_grid, testimonial, logo_grid, stats, accordion, tabs, footer, sidebar, breadcrumb, search, video_embed, image_gallery, pricing_table, feature_grid, team_grid, timeline, faq, newsletter_signup, social_links, other
- styleDescription: brief description of visual style (colors, layout, typography)
- position: one of: header, above_fold, mid_page, below_fold, footer
- complexity: "simple", "moderate", or "complex"

Return a JSON array of components found.`;

  const response = await callClaudeWithImage(prompt, screenshotUrl, {
    model: "claude-sonnet-4-6",
  });

  try {
    const cleaned = response.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);
    return (Array.isArray(parsed) ? parsed : []).map(
      (item: Record<string, string>) => ({
        type: item.type ?? "other",
        styleDescription: item.styleDescription ?? "",
        position: item.position ?? "mid_page",
        complexity: (["simple", "moderate", "complex"].includes(item.complexity)
          ? item.complexity
          : "moderate") as "simple" | "moderate" | "complex",
      })
    );
  } catch {
    console.error("Failed to parse component detection response:", response);
    return [];
  }
}

export async function detectPageSections(
  screenshotUrl: string,
  pageUrl: string,
  rawHtml?: string | null
): Promise<PageSection[]> {
  // Extract HTML structure if available
  const htmlSections = rawHtml ? extractHtmlSections(rawHtml) : [];
  const htmlContext = htmlSections.length > 0
    ? formatHtmlSectionsForPrompt(htmlSections)
    : "";

  // Pre-fetch image dimensions so the prompt can tell the AI the exact height
  const sharp = (await import("sharp")).default;
  const imgRes = await fetch(screenshotUrl);
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
  const imgMeta = await sharp(imgBuffer).metadata();
  const imageHeight = imgMeta.height ?? 0;

  const { text: response } = await callClaudeWithImage(
    buildSectionPrompt(pageUrl, htmlContext, imageHeight),
    screenshotUrl,
    { model: "claude-sonnet-4-6", returnMeta: true }
  );

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

    const sections = parsePageSections(parsed);

    if (sections.length === 0) {
      throw new Error("AI returned no valid sections");
    }

    return sections;
  } catch (err) {
    console.error("Failed to parse page sections response:", response);
    throw new Error(
      `Component detection failed: ${err instanceof Error ? err.message : "could not parse AI response"}`
    );
  }
}

function buildSectionPrompt(pageUrl: string, htmlContext: string, imageHeight: number): string {
  const htmlBlock = htmlContext
    ? `\n\n${htmlContext}\n\nUse the HTML structure above to guide your section boundaries. Each visual section on the screenshot should correspond to one or more of these HTML elements. This helps you identify exact boundaries between sections.`
    : "";

  const heightInfo = imageHeight > 0
    ? `\n\nThe image is ${imageHeight}px tall. Your yEndPx values must not exceed ${imageHeight}.`
    : "";

  return `Analyze this full-page screenshot and split it into horizontal sections from top to bottom.

Page URL: ${pageUrl}${htmlBlock}${heightInfo}

For each section (horizontal band of the page), provide:
- sectionLabel: a descriptive name (e.g., "Navigation Bar", "Hero Banner", "Feature Cards", "Testimonials", "Footer")
- yStartPx: the Y pixel coordinate where this section starts (top edge of its visual content)
- yEndPx: the Y pixel coordinate where this section ends (bottom edge of its visual content)
- components: an array of UI components within that section, each with:
  - type: one of: hero, navigation, sub_navigation, cta, form, card_grid, testimonial, logo_grid, stats, accordion, tabs, footer, sidebar, breadcrumb, search, video_embed, image_gallery, pricing_table, feature_grid, team_grid, timeline, faq, newsletter_signup, social_links, banner, content_block, other
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
  {"sectionLabel": "Navigation", "yStartPx": 0, "yEndPx": 80, "components": [{"type": "navigation", "styleDescription": "Dark header, logo left, links right", "complexity": "moderate"}]},
  {"sectionLabel": "Hero", "yStartPx": 80, "yEndPx": 650, "components": [{"type": "hero", "styleDescription": "Full-width banner with headline and CTA", "complexity": "complex"}]}
]`;
}
