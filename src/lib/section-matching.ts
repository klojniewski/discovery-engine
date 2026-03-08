/**
 * Match a free-form section label to a known section type.
 * Simple normalized lookup — no fuzzy matching.
 * Will be replaced when the AI prompt returns taxonomy slugs directly.
 */

interface SectionTypeEntry {
  slug: string;
  name: string;
  category: string;
}

export function matchSectionType<T extends SectionTypeEntry>(
  label: string,
  sectionTypes: T[]
): T | null {
  const normalized = label.toLowerCase().replace(/[\s_]+/g, "-");

  // Direct match on slug
  const exact = sectionTypes.find((s) => s.slug === normalized);
  if (exact) return exact;

  // Check if any slug is contained in the normalized label
  // Sort by slug length descending to prefer longer (more specific) matches
  const sorted = [...sectionTypes].sort(
    (a, b) => b.slug.length - a.slug.length
  );
  return sorted.find((s) => normalized.includes(s.slug)) ?? null;
}
