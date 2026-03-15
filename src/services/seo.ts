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

export function computeSeoScore(page: {
  trafficValueCents: number | null;
  referringDomains: number | null;
  organicTraffic: number | null;
}): { score: number; isRedirectCritical: boolean } {
  const trafficScore = normalizeLog(
    centsToUsd(page.trafficValueCents ?? 0),
    500
  );
  const linkScore = normalizeLog(page.referringDomains ?? 0, 50);
  const volumeScore = normalizeLog(page.organicTraffic ?? 0, 2000);

  const score = Math.round(
    trafficScore * 0.45 + linkScore * 0.35 + volumeScore * 0.2
  );

  const isRedirectCritical =
    score >= 50 ||
    centsToUsd(page.trafficValueCents ?? 0) >= 50 ||
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
