import * as cheerio from "cheerio";

export interface OnPageSeoSignals {
  h1: string | null;
  canonicalUrl: string | null;
  metaRobots: string | null;
  schemaOrgTypes: string[];
  internalLinkCount: number;
}

export function extractOnPageSeo(
  rawHtml: string,
  pageUrl: string
): OnPageSeoSignals {
  const $ = cheerio.load(rawHtml);
  const domain = new URL(pageUrl).hostname;

  const h1 = $("h1").first().text().trim() || null;
  const canonicalUrl = $('link[rel="canonical"]').attr("href") || null;
  const metaRobots = $('meta[name="robots"]').attr("content") || null;

  const schemaOrgTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || "");
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        if (item["@type"]) {
          const types = Array.isArray(item["@type"])
            ? item["@type"]
            : [item["@type"]];
          schemaOrgTypes.push(...types.filter(Boolean));
        }
      }
    } catch {
      /* ignore invalid JSON-LD */
    }
  });

  let internalLinkCount = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const linkUrl = new URL(href, pageUrl);
      if (
        linkUrl.hostname === domain ||
        linkUrl.hostname.endsWith(`.${domain}`)
      ) {
        internalLinkCount++;
      }
    } catch {
      /* ignore malformed hrefs */
    }
  });

  return { h1, canonicalUrl, metaRobots, schemaOrgTypes, internalLinkCount };
}

/**
 * On-page health score (0-100) based on HTML extraction signals.
 * Each signal contributes points — a well-optimised page scores 100.
 */
export function computeOnPageHealthScore(page: {
  h1: string | null;
  canonicalUrl: string | null;
  metaRobots: string | null;
  schemaOrgTypes: string[] | null;
  internalLinkCount: number | null;
}): number {
  let score = 0;
  // Has H1 tag (25 points)
  if (page.h1) score += 25;
  // Has canonical URL (25 points)
  if (page.canonicalUrl) score += 25;
  // Not noindexed (20 points) — null meta robots = fine, noindex = penalty
  if (!page.metaRobots?.toLowerCase().includes("noindex")) score += 20;
  // Has schema.org markup (15 points)
  if (page.schemaOrgTypes && page.schemaOrgTypes.length > 0) score += 15;
  // Has internal links (15 points) — at least 3 internal links
  if ((page.internalLinkCount ?? 0) >= 3) score += 15;
  return score;
}

/**
 * SEO score: 45% organic traffic + 35% referring domains + 20% on-page health.
 *
 * Previous formula double-counted by using both trafficValueCents (traffic × CPC)
 * and organicTraffic (raw clicks). Fixed to use organic traffic as the traffic signal
 * and on-page health from HTML extraction as the third factor.
 *
 * Redirect-critical: score >= 50, OR organic traffic >= 100/mo, OR referring domains >= 5.
 */
export function computeSeoScore(page: {
  organicTraffic: number | null;
  referringDomains: number | null;
  h1: string | null;
  canonicalUrl: string | null;
  metaRobots: string | null;
  schemaOrgTypes: string[] | null;
  internalLinkCount: number | null;
}): { score: number; isRedirectCritical: boolean } {
  const trafficScore = normalizeLog(page.organicTraffic ?? 0, 2000);
  const linkScore = normalizeLog(page.referringDomains ?? 0, 50);
  const healthScore = computeOnPageHealthScore(page);

  const score = Math.round(
    trafficScore * 0.45 + linkScore * 0.35 + healthScore * 0.2
  );

  const isRedirectCritical =
    score >= 50 ||
    (page.organicTraffic ?? 0) >= 100 ||
    (page.referringDomains ?? 0) >= 5;

  return { score, isRedirectCritical };
}

function normalizeLog(value: number, maxExpected: number): number {
  if (value <= 0) return 0;
  return Math.min(
    100,
    Math.round((Math.log(value + 1) / Math.log(maxExpected + 1)) * 100)
  );
}

function centsToUsd(cents: number): number {
  return cents / 100;
}
