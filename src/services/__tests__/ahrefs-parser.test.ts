import { describe, it, expect } from "vitest";
import { parseAhrefsCsv } from "@/services/ahrefs-parser";
import { readFileSync } from "fs";
import { join } from "path";

function loadFixture(filename: string): ArrayBuffer {
  const buf = readFileSync(
    join(
      process.cwd(),
      "docs/example-ahrefs-csv",
      filename
    )
  );
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe("parseAhrefsCsv", () => {
  describe("Top Pages", () => {
    it("auto-detects Top Pages file type", () => {
      const buffer = loadFixture(
        "pagepro.co-top-pages-subdomains-all--compa_2026-03-15_09-36-11.csv"
      );
      const result = parseAhrefsCsv(buffer);
      expect(result.fileType).toBe("top_pages");
    });

    it("parses all data rows", () => {
      const buffer = loadFixture(
        "pagepro.co-top-pages-subdomains-all--compa_2026-03-15_09-36-11.csv"
      );
      const result = parseAhrefsCsv(buffer);
      expect(result.rowCount).toBe(154);
    });

    it("extracts traffic and keyword data", () => {
      const buffer = loadFixture(
        "pagepro.co-top-pages-subdomains-all--compa_2026-03-15_09-36-11.csv"
      );
      const result = parseAhrefsCsv(buffer);
      expect(result.fileType).toBe("top_pages");

      const rows = result.rows as Array<{
        url: string;
        currentTraffic: number;
        currentTrafficValue: number;
        currentTopKeyword: string;
      }>;

      // Find the web-development-best-practices page (first row in CSV)
      const bestPractices = rows.find((r) =>
        r.url.includes("web-development-best-practices")
      );
      expect(bestPractices).toBeDefined();
      expect(bestPractices!.currentTraffic).toBe(2523);
      expect(bestPractices!.currentTrafficValue).toBe(100.93);
      expect(bestPractices!.currentTopKeyword).toBe(
        "web development best practices"
      );
    });
  });

  describe("Best by Links", () => {
    it("auto-detects Best by Links file type", () => {
      const buffer = loadFixture(
        "pagepro.co-bbl-external-subdomains_2026-03-15_09-35-50.csv"
      );
      const result = parseAhrefsCsv(buffer);
      expect(result.fileType).toBe("best_links");
    });

    it("parses all data rows", () => {
      const buffer = loadFixture(
        "pagepro.co-bbl-external-subdomains_2026-03-15_09-35-50.csv"
      );
      const result = parseAhrefsCsv(buffer);
      expect(result.rowCount).toBe(373);
    });

    it("extracts referring domains and HTTP codes", () => {
      const buffer = loadFixture(
        "pagepro.co-bbl-external-subdomains_2026-03-15_09-35-50.csv"
      );
      const result = parseAhrefsCsv(buffer);
      expect(result.fileType).toBe("best_links");

      const rows = result.rows as Array<{
        pageUrl: string;
        referringDomains: number;
        pageHttpCode?: number;
      }>;

      // Homepage should have the most referring domains
      const homepage = rows.find((r) => r.pageUrl === "https://pagepro.co/");
      expect(homepage).toBeDefined();
      expect(homepage!.referringDomains).toBe(487);
      expect(homepage!.pageHttpCode).toBe(200);
    });
  });

  describe("encoding detection", () => {
    it("handles UTF-16LE BOM correctly", () => {
      // Both example files are UTF-16LE — if parsing works, encoding detection works
      const buffer = loadFixture(
        "pagepro.co-top-pages-subdomains-all--compa_2026-03-15_09-36-11.csv"
      );
      const result = parseAhrefsCsv(buffer);
      expect(result.rowCount).toBeGreaterThan(0);
      expect(result.parseErrors).toBe(0);
    });
  });

  describe("error handling", () => {
    it("throws on empty file", () => {
      const buffer = new ArrayBuffer(0);
      expect(() => parseAhrefsCsv(buffer)).toThrow();
    });

    it("throws on unrecognized file format", () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode("Col1\tCol2\nval1\tval2\n").buffer;
      expect(() => parseAhrefsCsv(buffer)).toThrow(
        "Could not detect Ahrefs file type"
      );
    });
  });
});
