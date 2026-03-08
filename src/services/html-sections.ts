/**
 * Extract structural sections from raw HTML for section detection.
 * Returns a summary of top-level structural elements that the AI
 * can match against the visual screenshot.
 */

interface HtmlSection {
  index: number;
  tag: string;
  id: string | null;
  className: string | null;
  textPreview: string;
}

export function extractHtmlSections(rawHtml: string): HtmlSection[] {
  // Find the <body> or <main> content
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyHtml = bodyMatch?.[1] ?? rawHtml;

  // Check if there's a <main> element — prefer its children
  const mainMatch = bodyHtml.match(/<main[^>]*>([\s\S]*)<\/main>/i);
  const containerHtml = mainMatch?.[1] ?? bodyHtml;

  // Extract direct children that are structural elements
  // Match top-level tags: header, nav, section, article, aside, footer, div
  const structuralTags = /^(header|nav|section|article|aside|footer|div)$/i;
  const sections: HtmlSection[] = [];

  // Simple regex-based extraction of top-level elements
  // We track nesting depth to only get direct children
  const tagPattern = /<(header|nav|section|article|aside|footer|div)(\s[^>]*)?\s*>/gi;
  let match;

  while ((match = tagPattern.exec(containerHtml)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] ?? "";

    // Check nesting: count how many unclosed structural tags are before this position
    const before = containerHtml.slice(0, match.index);
    const depth = getStructuralDepth(before);
    if (depth > 0) continue; // skip nested elements

    const id = attrs.match(/id=["']([^"']+)["']/)?.[1] ?? null;
    const className = attrs.match(/class=["']([^"']+)["']/)?.[1] ?? null;

    // Get the inner content of this element for text preview
    const startIdx = match.index + match[0].length;
    const endTag = findClosingTag(containerHtml, tag, startIdx);
    const innerHtml = endTag > startIdx ? containerHtml.slice(startIdx, endTag) : "";

    // Strip HTML tags, collapse whitespace, take first 120 chars
    const textContent = innerHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);

    if (!textContent && !id && !className) continue; // skip empty structural wrappers

    sections.push({
      index: sections.length,
      tag,
      id,
      className: className ? truncateClassName(className) : null,
      textPreview: textContent,
    });
  }

  return sections;
}

function getStructuralDepth(html: string): number {
  const structuralTags = ["header", "nav", "section", "article", "aside", "footer", "div"];
  let depth = 0;
  for (const tag of structuralTags) {
    const opens = (html.match(new RegExp(`<${tag}[\\s>]`, "gi")) || []).length;
    const closes = (html.match(new RegExp(`</${tag}>`, "gi")) || []).length;
    depth += opens - closes;
  }
  return depth;
}

function findClosingTag(html: string, tag: string, startIdx: number): number {
  let depth = 1;
  const openPattern = new RegExp(`<${tag}[\\s>]`, "gi");
  const closePattern = new RegExp(`</${tag}>`, "gi");

  openPattern.lastIndex = startIdx;
  closePattern.lastIndex = startIdx;

  // Collect all opens and closes after startIdx, sort by position
  const events: { pos: number; type: "open" | "close" }[] = [];

  let m;
  while ((m = openPattern.exec(html)) !== null) {
    events.push({ pos: m.index, type: "open" });
  }
  while ((m = closePattern.exec(html)) !== null) {
    events.push({ pos: m.index, type: "close" });
  }

  events.sort((a, b) => a.pos - b.pos);

  for (const event of events) {
    if (event.type === "open") depth++;
    else depth--;
    if (depth === 0) return event.pos;
  }

  return -1;
}

function truncateClassName(className: string): string {
  // Keep first 3 meaningful class names
  const classes = className.split(/\s+/).filter(Boolean);
  if (classes.length <= 3) return className;
  return classes.slice(0, 3).join(" ") + "...";
}

export function formatHtmlSectionsForPrompt(sections: HtmlSection[]): string {
  if (sections.length === 0) return "";

  const lines = sections.map((s) => {
    const parts = [`${s.index + 1}. <${s.tag}>`];
    if (s.id) parts.push(`id="${s.id}"`);
    if (s.className) parts.push(`class="${s.className}"`);
    if (s.textPreview) parts.push(`— "${s.textPreview}"`);
    return parts.join(" ");
  });

  return `The page HTML has these top-level structural sections (in DOM order, top to bottom):\n${lines.join("\n")}`;
}
