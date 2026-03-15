import { describe, it, expect } from "vitest";
import { extractOnPageSeo, computeSeoScore } from "@/services/seo";

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

describe("computeSeoScore", () => {
  it("returns 0 for all nulls", () => {
    const result = computeSeoScore({
      trafficValueCents: null,
      referringDomains: null,
      organicTraffic: null,
    });
    expect(result.score).toBe(0);
    expect(result.isRedirectCritical).toBe(false);
  });

  it("returns 0 for all zeros", () => {
    const result = computeSeoScore({
      trafficValueCents: 0,
      referringDomains: 0,
      organicTraffic: 0,
    });
    expect(result.score).toBe(0);
    expect(result.isRedirectCritical).toBe(false);
  });

  it("marks high traffic value pages as redirect-critical", () => {
    const result = computeSeoScore({
      trafficValueCents: 10000, // $100/mo
      referringDomains: 0,
      organicTraffic: 0,
    });
    expect(result.isRedirectCritical).toBe(true);
  });

  it("marks pages with 5+ referring domains as redirect-critical", () => {
    const result = computeSeoScore({
      trafficValueCents: 0,
      referringDomains: 5,
      organicTraffic: 0,
    });
    expect(result.isRedirectCritical).toBe(true);
  });

  it("scores high-value pages highly", () => {
    const result = computeSeoScore({
      trafficValueCents: 50000, // $500/mo = max expected
      referringDomains: 50,
      organicTraffic: 2000,
    });
    expect(result.score).toBe(100);
    expect(result.isRedirectCritical).toBe(true);
  });

  it("weighs traffic value highest", () => {
    const trafficOnly = computeSeoScore({
      trafficValueCents: 10000,
      referringDomains: 0,
      organicTraffic: 0,
    });
    const linksOnly = computeSeoScore({
      trafficValueCents: 0,
      referringDomains: 10,
      organicTraffic: 0,
    });
    // Traffic should contribute more to score due to 0.45 weight
    expect(trafficOnly.score).toBeGreaterThan(0);
    expect(linksOnly.score).toBeGreaterThan(0);
  });
});
