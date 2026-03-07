import { callClaudeWithImage } from "./anthropic";

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
