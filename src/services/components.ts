import { callClaudeWithImage } from "./anthropic";
import type { PageSection } from "@/types/page-sections";
import { parsePageSections } from "@/types/page-sections";

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
  pageUrl: string
): Promise<PageSection[]> {
  const prompt = `Analyze this full-page screenshot and split it into horizontal sections from top to bottom.

Page URL: ${pageUrl}

For each section (horizontal band of the page), identify:
- sectionLabel: a descriptive name (e.g., "Navigation Bar", "Hero Banner", "Feature Cards", "Testimonials", "Footer")
- components: an array of UI components within that section, each with:
  - type: one of: hero, navigation, sub_navigation, cta, form, card_grid, testimonial, logo_grid, stats, accordion, tabs, footer, sidebar, breadcrumb, search, video_embed, image_gallery, pricing_table, feature_grid, team_grid, timeline, faq, newsletter_signup, social_links, banner, content_block, other
  - styleDescription: brief visual description (colors, layout, typography, key text)
  - complexity: "simple", "moderate", or "complex"

Return a JSON array of sections in top-to-bottom order. Each section has sectionLabel and components array.

Example:
[
  {"sectionLabel": "Navigation", "components": [{"type": "navigation", "styleDescription": "Dark header, logo left, links right", "complexity": "moderate"}]},
  {"sectionLabel": "Hero", "components": [{"type": "hero", "styleDescription": "Full-width banner with headline and CTA", "complexity": "complex"}]}
]`;

  const response = await callClaudeWithImage(prompt, screenshotUrl, {
    model: "claude-sonnet-4-6",
  });

  try {
    const cleaned = response.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);
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
