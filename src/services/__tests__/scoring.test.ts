import { describe, it, expect } from "vitest";
import { assignContentTier } from "../scoring";

const baseInput = {
  wordCount: 500,
  navigationDepth: 1,
  hasTitle: true,
  hasMetaDescription: true,
  hasH1: true,
  titleLength: 45,
  metaDescriptionLength: 140,
  isDuplicate: false,
  isOrphan: false,
};

describe("assignContentTier", () => {
  it("assigns must_migrate for substantial content with good metadata and shallow depth", () => {
    expect(assignContentTier({ ...baseInput, wordCount: 1200 })).toBe(
      "must_migrate"
    );
  });

  it("assigns must_migrate for medium content with good metadata and depth <= 3", () => {
    expect(assignContentTier({ ...baseInput, wordCount: 500, navigationDepth: 2 })).toBe(
      "must_migrate"
    );
  });

  it("assigns improve for medium content with poor metadata", () => {
    expect(
      assignContentTier({
        ...baseInput,
        wordCount: 600,
        hasMetaDescription: false,
        metaDescriptionLength: 0,
      })
    ).toBe("improve");
  });

  it("assigns consolidate for duplicate pages regardless of quality", () => {
    expect(
      assignContentTier({ ...baseInput, isDuplicate: true, wordCount: 2000 })
    ).toBe("consolidate");
  });

  it("assigns archive for thin content at deep depth", () => {
    expect(
      assignContentTier({ ...baseInput, wordCount: 100, navigationDepth: 5 })
    ).toBe("archive");
  });

  it("assigns improve for thin content at shallow depth", () => {
    expect(
      assignContentTier({ ...baseInput, wordCount: 150, navigationDepth: 1 })
    ).toBe("improve");
  });

  it("assigns archive for thin orphan pages at shallow depth", () => {
    expect(
      assignContentTier({
        ...baseInput,
        wordCount: 150,
        navigationDepth: 1,
        isOrphan: true,
      })
    ).toBe("archive");
  });

  it("assigns improve for deep pages with content", () => {
    expect(
      assignContentTier({ ...baseInput, wordCount: 800, navigationDepth: 5 })
    ).toBe("improve");
  });

  it("handles null word count as 0", () => {
    expect(
      assignContentTier({ ...baseInput, wordCount: null, navigationDepth: 5 })
    ).toBe("archive");
  });

  it("handles null navigation depth as deep", () => {
    expect(
      assignContentTier({ ...baseInput, wordCount: 100, navigationDepth: null })
    ).toBe("archive");
  });
});
