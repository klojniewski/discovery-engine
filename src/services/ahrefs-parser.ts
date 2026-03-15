import { z } from "zod";

export type AhrefsFileType = "top_pages" | "best_links";

const TopPageRowSchema = z.object({
  url: z.string().url(),
  currentTraffic: z.coerce.number().default(0),
  currentTrafficValue: z.coerce.number().default(0),
  currentReferringDomains: z.coerce.number().default(0),
  currentTopKeyword: z.string().default(""),
  currentTopKeywordVolume: z.coerce.number().default(0),
  currentTopKeywordPosition: z.coerce.number().default(0),
});

const BestLinksRowSchema = z.object({
  pageUrl: z.string().url(),
  referringDomains: z.coerce.number().default(0),
  dofollow: z.coerce.number().default(0),
  nofollow: z.coerce.number().default(0),
  pageHttpCode: z.coerce.number().optional(),
});

export type TopPageRow = z.infer<typeof TopPageRowSchema>;
export type BestLinksRow = z.infer<typeof BestLinksRowSchema>;

export interface AhrefsParseResult {
  fileType: AhrefsFileType;
  rows: TopPageRow[] | BestLinksRow[];
  rowCount: number;
  parseErrors: number;
}

/** Column name mappings from Ahrefs TSV headers to our schema fields */
const TOP_PAGES_COLUMNS: Record<string, keyof z.infer<typeof TopPageRowSchema>> = {
  "URL": "url",
  "Current traffic": "currentTraffic",
  "Current traffic value": "currentTrafficValue",
  "Current referring domains": "currentReferringDomains",
  "Current top keyword": "currentTopKeyword",
  "Current top keyword: Volume": "currentTopKeywordVolume",
  "Current top keyword: Position": "currentTopKeywordPosition",
};

const BEST_LINKS_COLUMNS: Record<string, keyof z.infer<typeof BestLinksRowSchema>> = {
  "Page URL": "pageUrl",
  "Referring domains": "referringDomains",
  "Dofollow": "dofollow",
  "Nofollow": "nofollow",
  "Page HTTP code": "pageHttpCode",
};

export function parseAhrefsCsv(buffer: ArrayBuffer): AhrefsParseResult {
  const text = decodeBuffer(buffer);
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    throw new Error("File is empty or has no data rows");
  }

  const headers = parseTsvLine(lines[0]);
  const fileType = detectFileType(headers);

  if (fileType === "top_pages") {
    return parseTopPages(headers, lines.slice(1));
  } else {
    return parseBestLinks(headers, lines.slice(1));
  }
}

function decodeBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Check for UTF-16LE BOM (0xFF 0xFE)
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(buffer);
  }
  // Check for UTF-8 BOM and fall back to UTF-8
  return new TextDecoder("utf-8").decode(buffer);
}

function detectFileType(headers: string[]): AhrefsFileType {
  const normalized = headers.map((h) => h.replace(/^\uFEFF/, "").trim());
  if (normalized[0] === "URL" && normalized.includes("Current traffic")) {
    return "top_pages";
  }
  if (normalized[0] === "Page title" && normalized.includes("Referring domains")) {
    return "best_links";
  }
  throw new Error(
    "Could not detect Ahrefs file type. Expected Top Pages or Best by Links export."
  );
}

function parseTsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "\t" && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function buildColumnIndex(
  headers: string[],
  mapping: Record<string, string>
): Map<string, number> {
  const index = new Map<string, number>();
  const normalized = headers.map((h) => h.replace(/^\uFEFF/, "").trim());
  for (const [headerName, fieldName] of Object.entries(mapping)) {
    const idx = normalized.indexOf(headerName);
    if (idx !== -1) {
      index.set(fieldName, idx);
    }
  }
  return index;
}

function parseTopPages(
  headers: string[],
  dataLines: string[]
): AhrefsParseResult {
  const colIndex = buildColumnIndex(headers, TOP_PAGES_COLUMNS);
  const rows: TopPageRow[] = [];
  let parseErrors = 0;

  for (const line of dataLines) {
    const fields = parseTsvLine(line);
    const raw: Record<string, string> = {};
    for (const [field, idx] of colIndex) {
      raw[field] = fields[idx] ?? "";
    }
    const result = TopPageRowSchema.safeParse(raw);
    if (result.success) {
      rows.push(result.data);
    } else {
      parseErrors++;
    }
  }

  return { fileType: "top_pages", rows, rowCount: rows.length, parseErrors };
}

function parseBestLinks(
  headers: string[],
  dataLines: string[]
): AhrefsParseResult {
  const colIndex = buildColumnIndex(headers, BEST_LINKS_COLUMNS);
  const rows: BestLinksRow[] = [];
  let parseErrors = 0;

  for (const line of dataLines) {
    const fields = parseTsvLine(line);
    const raw: Record<string, string> = {};
    for (const [field, idx] of colIndex) {
      raw[field] = fields[idx] ?? "";
    }
    const result = BestLinksRowSchema.safeParse(raw);
    if (result.success) {
      rows.push(result.data);
    } else {
      parseErrors++;
    }
  }

  return { fileType: "best_links", rows, rowCount: rows.length, parseErrors };
}
