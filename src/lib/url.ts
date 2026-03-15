/**
 * Shared URL normalization used by crawl storage and Ahrefs CSV matching.
 * Forces HTTPS, strips query params/hash, removes trailing slashes, lowercases hostname.
 */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.protocol = "https:";
    u.search = "";
    u.hash = "";
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    u.hostname = u.hostname.toLowerCase();
    return u.toString();
  } catch {
    return raw;
  }
}
