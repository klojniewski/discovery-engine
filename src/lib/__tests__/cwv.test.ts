import { describe, it, expect } from "vitest";
import { normalizeUrls, evaluateCwv } from "@/lib/cwv";

describe("normalizeUrls", () => {
  it("returns empty array for empty input", () => {
    expect(normalizeUrls("")).toEqual([]);
  });

  it("auto-prepends https:// when scheme missing", () => {
    const result = normalizeUrls("example.com");
    expect(result).toHaveLength(1);
    expect(result[0].origin).toBe("https://example.com");
    expect(result[0].error).toBeUndefined();
  });

  it("lowercases hostname, strips path and query, de-dupes", () => {
    const result = normalizeUrls(
      "HTTPS://Example.COM/path?q=1\nexample.com"
    );
    expect(result).toHaveLength(1);
    expect(result[0].origin).toBe("https://example.com");
  });

  it("flags invalid URLs and unsupported schemes without failing the run", () => {
    const result = normalizeUrls("ftp://foo.com\nnot a url\nhttps://valid.com");
    expect(result).toHaveLength(3);
    expect(result[0].error).toBe("unsupported scheme");
    expect(result[1].error).toBe("invalid URL");
    expect(result[2].origin).toBe("https://valid.com");
    expect(result[2].error).toBeUndefined();
  });
});

describe("evaluateCwv", () => {
  const good = {
    largest_contentful_paint: { p75: 2000 },
    interaction_to_next_paint: { p75: 150 },
    cumulative_layout_shift: { p75: 0.05 },
  };

  it("returns pass when all three metrics are good", () => {
    const result = evaluateCwv(good);
    expect(result.status).toBe("pass");
  });

  it("treats goodMax values as passing (inclusive boundary)", () => {
    const result = evaluateCwv({
      largest_contentful_paint: { p75: 2500 },
      interaction_to_next_paint: { p75: 200 },
      cumulative_layout_shift: { p75: 0.1 },
    });
    expect(result.status).toBe("pass");
  });

  it("returns fail when any metric is not good", () => {
    const result = evaluateCwv({
      ...good,
      largest_contentful_paint: { p75: 3000 },
    });
    expect(result.status).toBe("fail");
  });

  it("returns no_data with partials when a metric is missing", () => {
    const result = evaluateCwv({
      largest_contentful_paint: { p75: 2000 },
      cumulative_layout_shift: { p75: 0.05 },
    });
    expect(result.status).toBe("no_data");
    if (result.status === "no_data") {
      expect(result.partial?.lcp?.status).toBe("good");
      expect(result.partial?.cls?.status).toBe("good");
      expect(result.partial?.inp).toBeUndefined();
    }
  });

  it("returns no_data without partials when all metrics are missing", () => {
    const result = evaluateCwv({});
    expect(result.status).toBe("no_data");
    if (result.status === "no_data") {
      expect(result.partial).toBeUndefined();
    }
  });
});
