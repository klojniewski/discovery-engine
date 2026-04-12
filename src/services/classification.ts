import { callClaude } from "./anthropic";

export type ContentTier = "must_migrate" | "improve" | "consolidate" | "archive";

interface PageInput {
  url: string;
  title: string | null;
  metaDescription: string | null;
  wordCount: number | null;
  contentPreview: string | null;
  isDuplicate?: boolean;
}

// ── URL-Prefix Grouping (Phase 1) ──────────────────────────────────

export interface PrefixGroup {
  prefix: string;
  pattern: string;
  pages: PageInput[];
  sampleUrls: string[];
  sampleTitles: string[];
  avgWordCount: number;
}

/**
 * Group pages by first URL path segment. Groups with 3+ pages qualify
 * as template groups; the rest are ungrouped singletons.
 */
export function groupPagesByUrlPrefix(
  pages: PageInput[]
): { groups: PrefixGroup[]; ungrouped: PageInput[] } {
  const prefixMap = new Map<string, PageInput[]>();

  for (const page of pages) {
    const prefix = extractPrefix(page.url);
    const list = prefixMap.get(prefix) ?? [];
    list.push(page);
    prefixMap.set(prefix, list);
  }

  const groups: PrefixGroup[] = [];
  const ungrouped: PageInput[] = [];

  for (const [prefix, groupPages] of prefixMap) {
    if (prefix === "/" || groupPages.length < 3) {
      ungrouped.push(...groupPages);
    } else {
      const wordCounts = groupPages
        .map((p) => p.wordCount ?? 0)
        .filter((w) => w > 0);
      const avgWordCount =
        wordCounts.length > 0
          ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
          : 0;

      groups.push({
        prefix,
        pattern: `${prefix}/*`,
        pages: groupPages,
        sampleUrls: groupPages.slice(0, 5).map((p) => p.url),
        sampleTitles: groupPages
          .slice(0, 5)
          .map((p) => p.title ?? "N/A"),
        avgWordCount,
      });
    }
  }

  return { groups, ungrouped };
}

/**
 * Extract index/listing pages from prefix groups into their own small groups.
 * An index page is one whose URL path exactly matches the group prefix
 * (e.g., /press-releases in a /press-releases/* group).
 *
 * Listing pages stay as groups (not ungrouped) so they go through the AI
 * naming step directly and skip the singleton merge pass — which would
 * otherwise merge all listing pages into one "hub" template.
 */
export function splitListingPages(
  groups: PrefixGroup[],
  ungrouped: PageInput[]
): { groups: PrefixGroup[]; ungrouped: PageInput[] } {
  const newGroups: PrefixGroup[] = [];

  for (const group of groups) {
    const indexPages: PageInput[] = [];
    const detailPages: PageInput[] = [];

    for (const page of group.pages) {
      try {
        const { pathname } = new URL(page.url);
        const clean = pathname.replace(/\/+$/, "") || "/";
        if (clean === group.prefix) {
          indexPages.push(page);
        } else {
          detailPages.push(page);
        }
      } catch {
        detailPages.push(page);
      }
    }

    if (indexPages.length > 0 && detailPages.length > 0) {
      // Listing pages become their own group with exact-match pattern
      newGroups.push(rebuildGroup(
        { ...group, pattern: group.prefix },
        indexPages
      ));
      // Detail pages stay as the original group
      newGroups.push(rebuildGroup(group, detailPages));
    } else {
      newGroups.push(group);
    }
  }

  return { groups: newGroups, ungrouped };
}

function rebuildGroup(original: PrefixGroup, pages: PageInput[]): PrefixGroup {
  const wordCounts = pages
    .map((p) => p.wordCount ?? 0)
    .filter((w) => w > 0);
  const avgWordCount =
    wordCounts.length > 0
      ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
      : 0;

  return {
    prefix: original.prefix,
    pattern: original.pattern,
    pages,
    sampleUrls: pages.slice(0, 5).map((p) => p.url),
    sampleTitles: pages.slice(0, 5).map((p) => p.title ?? "N/A"),
    avgWordCount,
  };
}

function extractPrefix(url: string): string {
  try {
    const { pathname } = new URL(url);
    const clean = pathname.replace(/\/+$/, "") || "/";
    if (clean === "/") return "/";

    const segments = clean.split("/").filter(Boolean);
    if (segments.length <= 1) return clean; // root-level page like /about
    return `/${segments[0]}`;
  } catch {
    return "/";
  }
}

// ── AI Template Naming (Phase 2a) ──────────────────────────────────

export interface NamedGroup {
  prefix: string;
  pattern: string;
  name: string;
  displayName: string;
  description: string;
  pages: PageInput[];
}

const MAX_GROUPS_PER_CALL = 50;

/**
 * Name prefix groups using AI. Chunks into calls of ≤50 groups.
 * Falls back to prefix-as-name if AI fails.
 */
export async function nameTemplateGroups(
  groups: PrefixGroup[],
  projectId?: string
): Promise<NamedGroup[]> {
  if (groups.length === 0) return [];

  const results: NamedGroup[] = [];

  for (let i = 0; i < groups.length; i += MAX_GROUPS_PER_CALL) {
    const chunk = groups.slice(i, i + MAX_GROUPS_PER_CALL);
    const named = await nameGroupChunk(chunk, projectId);
    results.push(...named);
  }

  return results;
}

async function nameGroupChunk(
  groups: PrefixGroup[],
  projectId?: string
): Promise<NamedGroup[]> {
  const groupDescriptions = groups
    .map(
      (g, idx) => {
        const isListing = !g.pattern.endsWith("/*");
        return `Group ${idx + 1}: ${g.pattern} (${g.pages.length} pages)${isListing ? " [LISTING/INDEX PAGE]" : ""}
  Sample URLs: ${g.sampleUrls.join(", ")}
  Sample titles: ${g.sampleTitles.map((t) => `"${t}"`).join(", ")}
  Avg word count: ${g.avgWordCount}`;
      }
    )
    .join("\n\n");

  const prompt = `Analyze these URL-prefix groups from a website and provide a name and description for each template type.

NAMING RULES:
- Groups marked [LISTING/INDEX PAGE] are section index pages. Their displayName MUST end with "Index" (e.g., "Blog Index", "Press Releases Index", "Events Index").
- All other groups are detail/content pages. Use a content-specific noun — never end with "Page". Good: "Blog Post", "Press Release", "Customer Story", "Award", "Legal Document". Bad: "Event Page", "Solution Page".

${groupDescriptions}

Return a JSON array with exactly ${groups.length} objects:
- "prefix": the URL pattern (e.g., "/blog/*")
- "name": a short kebab-case slug (e.g., "blog-post", "award", "press-release")
- "displayName": human-readable name following the naming rules above
- "description": one sentence describing what these pages contain`;

  try {
    const response = await callClaude(prompt, {
      usage: { projectId, step: "group-naming" },
    });

    const cleaned = response
      .replace(/^```(?:json)?\s*\n?/m, "")
      .replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length !== groups.length) {
      throw new Error("Response array length mismatch");
    }

    return groups.map((g, idx) => ({
      prefix: g.prefix,
      pattern: g.pattern,
      name: String(parsed[idx].name ?? prefixToSlug(g.prefix)),
      displayName: String(parsed[idx].displayName ?? prefixToDisplayName(g.prefix)),
      description: String(parsed[idx].description ?? ""),
      pages: g.pages,
    }));
  } catch (err) {
    console.error("Group naming AI call failed, using prefix fallback:", err);
    return groups.map((g) => {
      const isListing = !g.pattern.endsWith("/*");
      return {
        prefix: g.prefix,
        pattern: g.pattern,
        name: prefixToSlug(g.prefix) + (isListing ? "-index" : ""),
        displayName: prefixToDisplayName(g.prefix) + (isListing ? " Index" : ""),
        description: "",
        pages: g.pages,
      };
    });
  }
}

function prefixToSlug(prefix: string): string {
  return prefix.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "page";
}

function prefixToDisplayName(prefix: string): string {
  const slug = prefix.replace(/^\//, "");
  return slug
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Page";
}

// ── Singleton Classification (Phase 2b) ────────────────────────────

interface ClassifyResult {
  url: string;
  name: string;
  displayName: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

/**
 * Classify ungrouped pages using AI in batches of 10.
 * Free-form type output (no fixed enum).
 */
export async function classifySingletonPages(
  pages: PageInput[],
  projectId?: string,
  onProgress?: (completed: number, total: number) => void | Promise<void>
): Promise<ClassifyResult[]> {
  if (pages.length === 0) return [];

  const results: ClassifyResult[] = [];

  for (let i = 0; i < pages.length; i += 10) {
    const batch = pages.slice(i, i + 10);
    if (onProgress) await onProgress(i, pages.length);
    const batchResults = await classifySingletonBatch(batch, projectId);
    results.push(...batchResults);
  }
  if (onProgress) await onProgress(pages.length, pages.length);

  // Merge pass: consolidate semantically duplicate names across batches
  if (results.length > 0) {
    const merged = await mergeSingletonNames(results, projectId);
    return merged;
  }

  return results;
}

/**
 * Post-classification merge: ask AI to consolidate semantically duplicate
 * singleton names (e.g., "signup-landing-page" and "product-trial-signup"
 * both become "signup-page").
 */
async function mergeSingletonNames(
  results: ClassifyResult[],
  projectId?: string
): Promise<ClassifyResult[]> {
  // Collect unique names with page counts
  const nameCounts = new Map<string, { displayName: string; count: number }>();
  for (const r of results) {
    const existing = nameCounts.get(r.name);
    if (existing) {
      existing.count++;
    } else {
      nameCounts.set(r.name, { displayName: r.displayName, count: 1 });
    }
  }

  // If 5 or fewer unique names, no merge needed
  if (nameCounts.size <= 5) return results;

  const nameList = Array.from(nameCounts.entries())
    .map(([name, { displayName, count }]) => `- "${name}" ("${displayName}") — ${count} page${count > 1 ? "s" : ""}`)
    .join("\n");

  const prompt = `These template type names were assigned to individual pages on a website. Many are semantically duplicates or near-duplicates that should be consolidated into a single canonical name.

Current names:
${nameList}

Consolidate these into fewer canonical template types. Merge names that describe the same kind of page (e.g., "signup-landing-page" + "product-trial-signup" + "signup-page" → "signup-page").

Rules:
- Keep names that are genuinely distinct (e.g., "about-page" and "contact-page" are different)
- Prefer shorter, simpler canonical names
- "homepage" must stay as-is
- Return ALL original names, even ones that don't need merging

Return a JSON array of objects:
- "original": the original name
- "canonical": the consolidated name (same as original if no merge needed)
- "canonicalDisplayName": human-readable name for the canonical type`;

  try {
    const response = await callClaude(prompt, {
      usage: { projectId, step: "singleton-merge" },
    });

    const cleaned = response
      .replace(/^```(?:json)?\s*\n?/m, "")
      .replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) throw new Error("Expected array");

    // Build merge map: original name → canonical name/displayName
    const mergeMap = new Map<string, { canonical: string; canonicalDisplayName: string }>();
    for (const item of parsed) {
      mergeMap.set(
        String(item.original),
        {
          canonical: String(item.canonical),
          canonicalDisplayName: String(item.canonicalDisplayName),
        }
      );
    }

    // Apply merge map to results
    return results.map((r) => {
      const merged = mergeMap.get(r.name);
      if (merged && merged.canonical !== r.name) {
        return { ...r, name: merged.canonical, displayName: merged.canonicalDisplayName };
      }
      return r;
    });
  } catch (err) {
    console.error("Singleton name merge failed, keeping original names:", err);
    return results;
  }
}

async function classifySingletonBatch(
  pages: PageInput[],
  projectId?: string
): Promise<ClassifyResult[]> {
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

  const prompt = `Analyze each webpage and classify its template type.

For each page, determine what type of page template it uses. These are standalone pages not part of a URL-prefix group.

NAMING RULES:
- The displayName MUST end with "Page" (e.g., "About Page", "Contact Page", "Pricing Page", "Demo Page").
- Exception: "Homepage" stays as-is (no "Page" suffix needed).
- Use descriptive names that distinguish pages: "Sign-Up Page" not "Landing Page", "FAQ Page" not "Content Page".

Pages to analyze:
${pagesDescription}

Return a JSON array with exactly ${pages.length} objects:
- "url": the exact URL
- "name": a short kebab-case slug for the template type (e.g., "about-page", "pricing-page")
- "displayName": human-readable name ending with "Page" (e.g., "About Page", "Pricing Page")
- "confidence": "high", "medium", or "low"
- "reasoning": one sentence on why this template type`;

  try {
    const response = await callClaude(prompt, {
      usage: { projectId, step: "singleton-classification" },
    });

    const cleaned = response
      .replace(/^```(?:json)?\s*\n?/m, "")
      .replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);

    return (Array.isArray(parsed) ? parsed : []).map(
      (item: Record<string, string>) => ({
        url: item.url,
        name: String(item.name ?? "page"),
        displayName: String(item.displayName ?? "Page"),
        confidence: (["high", "medium", "low"].includes(item.confidence)
          ? item.confidence
          : "low") as "high" | "medium" | "low",
        reasoning: item.reasoning ?? "",
      })
    );
  } catch (err) {
    console.error("Singleton classification batch failed:", err);
    return pages.map((p) => ({
      url: p.url,
      name: "page",
      displayName: "Page",
      confidence: "low" as const,
      reasoning: "Classification failed",
    }));
  }
}

// ── Content Tier Scoring (Phase 3) ─────────────────────────────────

interface TierResult {
  url: string;
  tier: ContentTier;
  tierReasoning: string;
}

/**
 * Score content tiers for non-duplicate pages in batches of 10.
 * Duplicates should be pre-assigned "consolidate" before calling this.
 */
export async function scoreTiersBatch(
  pages: PageInput[],
  projectId?: string,
  onProgress?: (completed: number, total: number) => void | Promise<void>
): Promise<TierResult[]> {
  if (pages.length === 0) return [];

  const results: TierResult[] = [];

  for (let i = 0; i < pages.length; i += 10) {
    const batch = pages.slice(i, i + 10);
    if (onProgress) await onProgress(i, pages.length);
    const batchResults = await scoreBatch(batch, projectId);
    results.push(...batchResults);
  }
  if (onProgress) await onProgress(pages.length, pages.length);

  return results;
}

async function scoreBatch(
  pages: PageInput[],
  projectId?: string
): Promise<TierResult[]> {
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

  const prompt = `Analyze each webpage and assign a content migration tier.

CONTEXT: This is a risk-free website migration. The goal is to preserve the existing site structure and content. Most pages should be migrated.

CONTENT TIERS:
- "must_migrate": Any page with real content that serves a business purpose. This includes product/service pages, blog posts, case studies, about pages, legal pages, landing pages, resources, guides, press releases, documentation. When in doubt, choose must_migrate.
- "improve": Pages that should be migrated but need significant content updates — very outdated announcements with no lasting value, pages with broken/missing content, mostly placeholder text.
- "archive": ONLY pages with no real content — empty placeholder pages, error pages, pages with fewer than 50 words and no clear purpose.

GUIDELINES:
- Default to must_migrate. Most pages on a well-structured site should be migrated as-is.
- Blog posts with real content are must_migrate regardless of age — old content still has SEO value.
- Legal/policy pages are always must_migrate.
- improve means "migrate but flag for content review" — use sparingly.
- archive is rare — only for truly empty or broken pages.

Pages to analyze:
${pagesDescription}

Return a JSON array with exactly ${pages.length} objects:
- "url": the exact URL
- "tier": one of "must_migrate", "improve", "archive"
- "tierReasoning": one sentence on why this tier`;

  try {
    const response = await callClaude(prompt, {
      usage: { projectId, step: "tier-scoring" },
    });

    const cleaned = response
      .replace(/^```(?:json)?\s*\n?/m, "")
      .replace(/\n?```\s*$/m, "");
    const parsed = JSON.parse(cleaned);

    return (Array.isArray(parsed) ? parsed : []).map(
      (item: Record<string, string>) => ({
        url: item.url,
        tier: (["must_migrate", "improve", "archive"].includes(item.tier)
          ? item.tier
          : "improve") as ContentTier,
        tierReasoning: item.tierReasoning ?? "",
      })
    );
  } catch (err) {
    console.error("Tier scoring batch failed:", err);
    return pages.map((p) => ({
      url: p.url,
      tier: "improve" as ContentTier,
      tierReasoning: "Scoring failed — defaulting to improve",
    }));
  }
}
