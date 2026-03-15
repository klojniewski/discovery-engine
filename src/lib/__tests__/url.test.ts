import { describe, it, expect } from "vitest";
import { normalizeUrl } from "@/lib/url";

describe("normalizeUrl", () => {
  it("forces HTTPS", () => {
    expect(normalizeUrl("http://example.com/page")).toBe(
      "https://example.com/page"
    );
  });

  it("strips query params", () => {
    expect(normalizeUrl("https://example.com/page?foo=bar&baz=1")).toBe(
      "https://example.com/page"
    );
  });

  it("strips hash", () => {
    expect(normalizeUrl("https://example.com/page#section")).toBe(
      "https://example.com/page"
    );
  });

  it("removes trailing slash except root", () => {
    expect(normalizeUrl("https://example.com/blog/")).toBe(
      "https://example.com/blog"
    );
  });

  it("preserves root trailing slash", () => {
    expect(normalizeUrl("https://example.com/")).toBe(
      "https://example.com/"
    );
  });

  it("lowercases hostname", () => {
    expect(normalizeUrl("https://Example.COM/Page")).toBe(
      "https://example.com/Page"
    );
  });

  it("handles http + trailing slash + query params together", () => {
    expect(
      normalizeUrl("http://Example.com/blog/post/?utm_source=google")
    ).toBe("https://example.com/blog/post");
  });

  it("returns raw string for invalid URLs", () => {
    expect(normalizeUrl("not a url")).toBe("not a url");
  });
});
