export interface SectionComponent {
  type: string;
  styleDescription: string;
  complexity: "simple" | "moderate" | "complex";
}

export interface PageSection {
  sectionLabel: string;
  sectionType: string | null;
  yStartPercent: number;
  yEndPercent: number;
  components: SectionComponent[];
}

/** Parse and normalize AI response into PageSection[]. Returns valid sections, drops malformed ones. */
export function parsePageSections(
  raw: unknown,
  validSlugs?: string[]
): PageSection[] {
  if (!Array.isArray(raw)) return [];

  const slugSet = validSlugs ? new Set(validSlugs) : null;

  return raw
    .filter((item): item is Record<string, unknown> => item != null && typeof item === "object")
    .map((item) => {
      let sectionType: string | null = null;
      if (typeof item.sectionType === "string") {
        const normalized = item.sectionType.toLowerCase().trim();
        sectionType = slugSet ? (slugSet.has(normalized) ? normalized : null) : normalized;
      }

      return {
        sectionLabel: typeof item.sectionLabel === "string" ? item.sectionLabel : "Unknown Section",
        sectionType,
        yStartPercent: typeof item.yStartPercent === "number" ? item.yStartPercent : 0,
        yEndPercent: typeof item.yEndPercent === "number" ? item.yEndPercent : 0,
        components: Array.isArray(item.components)
          ? item.components
              .filter((c): c is Record<string, unknown> => c != null && typeof c === "object")
              .map((c) => ({
                type: typeof c.type === "string" ? c.type : "other",
                styleDescription: typeof c.styleDescription === "string" ? c.styleDescription : "",
                complexity: (["simple", "moderate", "complex"].includes(c.complexity as string)
                  ? c.complexity
                  : "moderate") as "simple" | "moderate" | "complex",
              }))
          : [],
      };
    })
    .filter((section) => section.components.length > 0);
}
