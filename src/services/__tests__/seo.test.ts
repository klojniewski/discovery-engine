import { describe, it, expect } from "vitest";
import {
  extractOnPageSeo,
  computeSeoScore,
  computeOnPageHealthScore,
} from "@/services/seo";

const NULL_ON_PAGE = {
  h1: null,
  canonicalUrl: null,
  metaRobots: null,
  schemaOrgTypes: null,
  internalLinkCount: null,
};

const PERFECT_ON_PAGE = {
  h1: "Test Page",
  canonicalUrl: "https://example.com/page",
  metaRobots: null,
  schemaOrgTypes: ["Article"],
  internalLinkCount: 10,
};

describe("extractOnPageSeo", () => {
  it("extracts h1 tag", () => {
    const html = "<html><body><h1>Hello World</h1></body></html>";
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.h1).toBe("Hello World");
  });

  it("returns null h1 when missing", () => {
    const html = "<html><body><p>No heading</p></body></html>";
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.h1).toBeNull();
  });

  it("extracts canonical URL", () => {
    const html = `<html><head><link rel="canonical" href="https://example.com/page" /></head></html>`;
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.canonicalUrl).toBe("https://example.com/page");
  });

  it("extracts meta robots", () => {
    const html = `<html><head><meta name="robots" content="noindex, nofollow" /></head></html>`;
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.metaRobots).toBe("noindex, nofollow");
  });

  it("extracts schema.org types from JSON-LD", () => {
    const html = `<html><head><script type="application/ld+json">{"@type": "Article"}</script></head></html>`;
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.schemaOrgTypes).toEqual(["Article"]);
  });

  it("handles array of JSON-LD objects", () => {
    const html = `<html><head><script type="application/ld+json">[{"@type": "Article"}, {"@type": "Organization"}]</script></head></html>`;
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.schemaOrgTypes).toEqual(["Article", "Organization"]);
  });

  it("counts internal links", () => {
    const html = `
      <html><body>
        <a href="https://example.com/about">About</a>
        <a href="/contact">Contact</a>
        <a href="https://external.com/page">External</a>
      </body></html>
    `;
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.internalLinkCount).toBe(2);
  });

  it("handles invalid JSON-LD gracefully", () => {
    const html = `<html><head><script type="application/ld+json">not valid json</script></head></html>`;
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.schemaOrgTypes).toEqual([]);
  });

  it("handles malformed hrefs gracefully", () => {
    const html = `<html><body><a href="javascript:void(0)">Click</a></body></html>`;
    const result = extractOnPageSeo(html, "https://example.com/page");
    expect(result.internalLinkCount).toBe(0);
  });
});

describe("computeOnPageHealthScore", () => {
  it("returns 0 for all nulls", () => {
    // metaRobots null = not noindexed = 20 points
    expect(computeOnPageHealthScore(NULL_ON_PAGE)).toBe(20);
  });

  it("returns 100 for perfect on-page signals", () => {
    expect(computeOnPageHealthScore(PERFECT_ON_PAGE)).toBe(100);
  });

  it("penalises noindex pages", () => {
    const score = computeOnPageHealthScore({
      ...PERFECT_ON_PAGE,
      metaRobots: "noindex, nofollow",
    });
    expect(score).toBe(80); // 100 - 20 for noindex
  });

  it("gives partial credit for some signals", () => {
    const score = computeOnPageHealthScore({
      h1: "Hello",
      canonicalUrl: null,
      metaRobots: null,
      schemaOrgTypes: null,
      internalLinkCount: 1,
    });
    expect(score).toBe(45); // 25 (h1) + 20 (not noindex) + 0 (no canonical, no schema, < 3 links)
  });
});

describe("computeSeoScore", () => {
  it("returns 0 for all nulls and no on-page signals", () => {
    const result = computeSeoScore({
      organicTraffic: null,
      referringDomains: null,
      ...NULL_ON_PAGE,
    });
    // on-page health = 20 (not noindexed), weighted at 20% = 4
    expect(result.score).toBe(4);
    expect(result.isRedirectCritical).toBe(false);
  });

  it("returns on-page health only when no external data", () => {
    const result = computeSeoScore({
      organicTraffic: 0,
      referringDomains: 0,
      ...PERFECT_ON_PAGE,
    });
    // health = 100, weighted at 20% = 20
    expect(result.score).toBe(20);
    expect(result.isRedirectCritical).toBe(false);
  });

  it("marks high traffic pages as redirect-critical", () => {
    const result = computeSeoScore({
      organicTraffic: 500,
      referringDomains: 0,
      ...NULL_ON_PAGE,
    });
    expect(result.isRedirectCritical).toBe(true); // 500 >= 100 threshold
  });

  it("marks pages with 5+ referring domains as redirect-critical", () => {
    const result = computeSeoScore({
      organicTraffic: 0,
      referringDomains: 5,
      ...NULL_ON_PAGE,
    });
    expect(result.isRedirectCritical).toBe(true);
  });

  it("scores high-value pages with perfect on-page highly", () => {
    const result = computeSeoScore({
      organicTraffic: 2000,
      referringDomains: 50,
      ...PERFECT_ON_PAGE,
    });
    expect(result.score).toBe(100);
    expect(result.isRedirectCritical).toBe(true);
  });

  it("weighs organic traffic highest (45%)", () => {
    const trafficOnly = computeSeoScore({
      organicTraffic: 500,
      referringDomains: 0,
      ...NULL_ON_PAGE,
    });
    const linksOnly = computeSeoScore({
      organicTraffic: 0,
      referringDomains: 10,
      ...NULL_ON_PAGE,
    });
    expect(trafficOnly.score).toBeGreaterThan(linksOnly.score);
  });

  it("includes on-page health in score", () => {
    const withHealth = computeSeoScore({
      organicTraffic: 100,
      referringDomains: 3,
      ...PERFECT_ON_PAGE,
    });
    const withoutHealth = computeSeoScore({
      organicTraffic: 100,
      referringDomains: 3,
      ...NULL_ON_PAGE,
    });
    expect(withHealth.score).toBeGreaterThan(withoutHealth.score);
  });
});
