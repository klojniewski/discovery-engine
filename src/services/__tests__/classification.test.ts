import { describe, it, expect, vi } from "vitest";

// Mock the anthropic module to avoid DB/API initialization
vi.mock("@/services/anthropic", () => ({
  callClaude: vi.fn(),
}));

import { groupPagesByUrlPrefix, splitListingPages } from "@/services/classification";

function makePage(url: string, title?: string, wordCount?: number) {
  return {
    url,
    title: title ?? null,
    metaDescription: null,
    wordCount: wordCount ?? null,
    contentPreview: null,
  };
}

describe("groupPagesByUrlPrefix", () => {
  it("groups pages by first path segment with 3+ pages", () => {
    const pages = [
      makePage("https://example.com/blog/post-1"),
      makePage("https://example.com/blog/post-2"),
      makePage("https://example.com/blog/post-3"),
      makePage("https://example.com/about"),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);

    expect(groups).toHaveLength(1);
    expect(groups[0].prefix).toBe("/blog");
    expect(groups[0].pattern).toBe("/blog/*");
    expect(groups[0].pages).toHaveLength(3);
    expect(ungrouped).toHaveLength(1);
    expect(ungrouped[0].url).toBe("https://example.com/about");
  });

  it("requires 3+ pages for a group", () => {
    const pages = [
      makePage("https://example.com/blog/post-1"),
      makePage("https://example.com/blog/post-2"),
      makePage("https://example.com/about"),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);

    expect(groups).toHaveLength(0);
    expect(ungrouped).toHaveLength(3);
  });

  it("homepage is always ungrouped", () => {
    const pages = [
      makePage("https://example.com/"),
      makePage("https://example.com/blog/post-1"),
      makePage("https://example.com/blog/post-2"),
      makePage("https://example.com/blog/post-3"),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);

    expect(groups).toHaveLength(1);
    expect(ungrouped).toHaveLength(1);
    expect(ungrouped[0].url).toBe("https://example.com/");
  });

  it("root-level pages are singletons", () => {
    const pages = [
      makePage("https://example.com/about"),
      makePage("https://example.com/pricing"),
      makePage("https://example.com/careers"),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);

    // Each root-level page has its own prefix (/about, /pricing, /careers)
    // None have 3+ pages, so all are ungrouped
    expect(groups).toHaveLength(0);
    expect(ungrouped).toHaveLength(3);
  });

  it("handles locale prefixes as separate groups", () => {
    const pages = [
      makePage("https://example.com/en/blog/post-1"),
      makePage("https://example.com/en/blog/post-2"),
      makePage("https://example.com/en/blog/post-3"),
      makePage("https://example.com/de/blog/post-1"),
      makePage("https://example.com/de/blog/post-2"),
      makePage("https://example.com/de/blog/post-3"),
    ];

    const { groups } = groupPagesByUrlPrefix(pages);

    expect(groups).toHaveLength(2);
    const prefixes = groups.map((g) => g.prefix).sort();
    expect(prefixes).toEqual(["/de", "/en"]);
  });

  it("returns empty results for empty input", () => {
    const { groups, ungrouped } = groupPagesByUrlPrefix([]);
    expect(groups).toHaveLength(0);
    expect(ungrouped).toHaveLength(0);
  });

  it("all pages in one prefix form one group", () => {
    const pages = Array.from({ length: 100 }, (_, i) =>
      makePage(`https://example.com/blog/post-${i}`)
    );

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);

    expect(groups).toHaveLength(1);
    expect(groups[0].pages).toHaveLength(100);
    expect(ungrouped).toHaveLength(0);
  });

  it("computes sample URLs (max 5) and avg word count", () => {
    const pages = [
      makePage("https://example.com/blog/a", "Title A", 1000),
      makePage("https://example.com/blog/b", "Title B", 2000),
      makePage("https://example.com/blog/c", "Title C", 3000),
      makePage("https://example.com/blog/d", "Title D", 4000),
      makePage("https://example.com/blog/e", "Title E", 5000),
      makePage("https://example.com/blog/f", "Title F", 6000),
    ];

    const { groups } = groupPagesByUrlPrefix(pages);

    expect(groups[0].sampleUrls).toHaveLength(5);
    expect(groups[0].sampleTitles).toHaveLength(5);
    expect(groups[0].avgWordCount).toBe(3500); // (1000+2000+3000+4000+5000+6000)/6
  });

  it("handles deeply nested URLs using first segment only", () => {
    const pages = [
      makePage("https://example.com/docs/v2/api/endpoints"),
      makePage("https://example.com/docs/v2/guides/getting-started"),
      makePage("https://example.com/docs/v1/legacy"),
    ];

    const { groups } = groupPagesByUrlPrefix(pages);

    expect(groups).toHaveLength(1);
    expect(groups[0].prefix).toBe("/docs");
  });

  it("handles trailing slashes", () => {
    const pages = [
      makePage("https://example.com/blog/post-1/"),
      makePage("https://example.com/blog/post-2/"),
      makePage("https://example.com/blog/post-3/"),
    ];

    const { groups } = groupPagesByUrlPrefix(pages);

    expect(groups).toHaveLength(1);
    expect(groups[0].prefix).toBe("/blog");
  });

  it("excludes pages with zero word count from avg calculation", () => {
    const pages = [
      makePage("https://example.com/blog/a", "A", 1000),
      makePage("https://example.com/blog/b", "B", 0),
      makePage("https://example.com/blog/c", "C", 2000),
    ];

    const { groups } = groupPagesByUrlPrefix(pages);

    // Only counts 1000 and 2000 (skips 0)
    expect(groups[0].avgWordCount).toBe(1500);
  });
});

describe("splitListingPages", () => {
  it("splits index page into its own group with exact-match pattern", () => {
    const pages = [
      makePage("https://example.com/blog", "Blog", 1200),
      makePage("https://example.com/blog/post-1", "Post 1", 800),
      makePage("https://example.com/blog/post-2", "Post 2", 900),
      makePage("https://example.com/blog/post-3", "Post 3", 700),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);
    expect(groups).toHaveLength(1);
    expect(groups[0].pages).toHaveLength(4);

    const result = splitListingPages(groups, ungrouped);

    // Should produce 2 groups: listing + detail
    expect(result.groups).toHaveLength(2);
    const listing = result.groups.find((g) => g.pattern === "/blog");
    const detail = result.groups.find((g) => g.pattern === "/blog/*");
    expect(listing).toBeDefined();
    expect(listing!.pages).toHaveLength(1);
    expect(listing!.pages[0].url).toBe("https://example.com/blog");
    expect(detail).toBeDefined();
    expect(detail!.pages).toHaveLength(3);
    // Ungrouped is unchanged
    expect(result.ungrouped).toHaveLength(0);
  });

  it("does not split group with no index page", () => {
    const pages = [
      makePage("https://example.com/blog/post-1"),
      makePage("https://example.com/blog/post-2"),
      makePage("https://example.com/blog/post-3"),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);
    const result = splitListingPages(groups, ungrouped);

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].pages).toHaveLength(3);
    expect(result.groups[0].pattern).toBe("/blog/*");
  });

  it("handles trailing slash on index page", () => {
    const pages = [
      makePage("https://example.com/events/", "Events", 2000),
      makePage("https://example.com/events/conf-1", "Conf 1", 500),
      makePage("https://example.com/events/conf-2", "Conf 2", 600),
      makePage("https://example.com/events/conf-3", "Conf 3", 700),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);
    const result = splitListingPages(groups, ungrouped);

    expect(result.groups).toHaveLength(2);
    const listing = result.groups.find((g) => g.pattern === "/events");
    expect(listing).toBeDefined();
    expect(listing!.pages[0].title).toBe("Events");
  });

  it("does not split group where all pages are at index depth", () => {
    const groups = [
      {
        prefix: "/blog",
        pattern: "/blog/*",
        pages: [
          makePage("https://example.com/blog", "Blog 1", 500),
          makePage("https://example.com/blog", "Blog 2", 600),
          makePage("https://example.com/blog", "Blog 3", 700),
        ],
        sampleUrls: [],
        sampleTitles: [],
        avgWordCount: 600,
      },
    ];

    const result = splitListingPages(groups, []);

    // All pages are index pages, no detail pages → no split
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].pages).toHaveLength(3);
  });

  it("preserves existing ungrouped pages", () => {
    const pages = [
      makePage("https://example.com/blog", "Blog", 1200),
      makePage("https://example.com/blog/post-1", "Post 1", 800),
      makePage("https://example.com/blog/post-2", "Post 2", 900),
      makePage("https://example.com/blog/post-3", "Post 3", 700),
    ];

    const { groups } = groupPagesByUrlPrefix(pages);
    const existingUngrouped = [makePage("https://example.com/about", "About", 500)];

    const result = splitListingPages(groups, existingUngrouped);

    // Ungrouped stays the same — listing page is a group, not ungrouped
    expect(result.ungrouped).toHaveLength(1);
    expect(result.ungrouped[0].url).toBe("https://example.com/about");
    // But groups now has 2 (listing + detail)
    expect(result.groups).toHaveLength(2);
  });

  it("recalculates group stats after splitting", () => {
    const pages = [
      makePage("https://example.com/blog", "Blog Index", 1200),
      makePage("https://example.com/blog/a", "Post A", 1000),
      makePage("https://example.com/blog/b", "Post B", 2000),
      makePage("https://example.com/blog/c", "Post C", 3000),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);
    const result = splitListingPages(groups, ungrouped);

    const detail = result.groups.find((g) => g.pattern === "/blog/*")!;
    expect(detail.avgWordCount).toBe(2000); // (1000+2000+3000)/3
    expect(detail.sampleUrls).toHaveLength(3);
    expect(detail.sampleTitles).toEqual(["Post A", "Post B", "Post C"]);

    const listing = result.groups.find((g) => g.pattern === "/blog")!;
    expect(listing.avgWordCount).toBe(1200);
    expect(listing.sampleUrls).toHaveLength(1);
  });

  it("splits multiple groups independently", () => {
    const pages = [
      makePage("https://example.com/blog", "Blog", 1200),
      makePage("https://example.com/blog/post-1"),
      makePage("https://example.com/blog/post-2"),
      makePage("https://example.com/blog/post-3"),
      makePage("https://example.com/events", "Events", 2000),
      makePage("https://example.com/events/conf-1"),
      makePage("https://example.com/events/conf-2"),
      makePage("https://example.com/events/conf-3"),
    ];

    const { groups, ungrouped } = groupPagesByUrlPrefix(pages);
    const result = splitListingPages(groups, ungrouped);

    // 2 original groups → 4 groups (2 listings + 2 details)
    expect(result.groups).toHaveLength(4);
    const listingPatterns = result.groups
      .filter((g) => !g.pattern.includes("*"))
      .map((g) => g.pattern)
      .sort();
    expect(listingPatterns).toEqual(["/blog", "/events"]);
    expect(result.ungrouped).toHaveLength(0);
  });

  it("returns empty results for empty input", () => {
    const result = splitListingPages([], []);
    expect(result.groups).toHaveLength(0);
    expect(result.ungrouped).toHaveLength(0);
  });
});
