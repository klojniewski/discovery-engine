import { describe, it, expect } from "vitest";
import {
  substituteString,
  substituteJson,
  rewriteUrlHost,
} from "@/lib/demo-clone";

describe("substituteString", () => {
  it("rewrites the branded hostname before word-level Dremio, so we don't end up with meridian.com", () => {
    expect(substituteString("Visit www.dremio.com/pricing")).toBe(
      "Visit meridian.ai/pricing"
    );
  });

  it("handles bare dremio.com", () => {
    expect(substituteString("docs.dremio.com")).toBe("docs.meridian.ai");
  });

  it("preserves case variants independently", () => {
    expect(substituteString("Dremio is DREMIO on dremio")).toBe(
      "Meridian is MERIDIAN on meridian"
    );
  });

  it("is a no-op on strings without brand markers", () => {
    const input = "Enterprise data lakehouse platform";
    expect(substituteString(input)).toBe(input);
  });
});

describe("substituteJson", () => {
  it("substitutes strings inside nested objects and arrays", () => {
    const input = {
      title: "Dremio pricing",
      tags: ["dremio", "enterprise"],
      nested: { url: "https://www.dremio.com", count: 3, enabled: true },
    };
    expect(substituteJson(input)).toEqual({
      title: "Meridian pricing",
      tags: ["meridian", "enterprise"],
      nested: { url: "https://meridian.ai", count: 3, enabled: true },
    });
  });

  it("preserves non-string leaves untouched", () => {
    expect(substituteJson({ n: 42, b: false, arr: [1, 2, null] })).toEqual({
      n: 42,
      b: false,
      arr: [1, 2, null],
    });
  });

  it("handles null and undefined by returning as-is", () => {
    expect(substituteJson(null)).toBeNull();
    expect(substituteJson(undefined)).toBeUndefined();
  });
});

describe("rewriteUrlHost", () => {
  it("swaps the host and preserves path, query, and hash", () => {
    expect(
      rewriteUrlHost("https://www.dremio.com/pricing?utm=x#faq", "meridian.ai")
    ).toBe("https://meridian.ai/pricing?utm=x#faq");
  });

  it("drops the port", () => {
    expect(rewriteUrlHost("http://www.dremio.com:8080/x", "meridian.ai")).toBe(
      "https://meridian.ai/x"
    );
  });

  it("forces https even when source is http", () => {
    expect(rewriteUrlHost("http://dremio.com/", "meridian.ai")).toBe(
      "https://meridian.ai/"
    );
  });

  it("returns invalid URLs unchanged", () => {
    expect(rewriteUrlHost("not a url", "meridian.ai")).toBe("not a url");
  });
});
