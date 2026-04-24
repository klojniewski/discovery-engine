/**
 * Pure helpers for cloning a project and rebranding all user-visible text.
 * Consumed by `scripts/clone-demo-project.ts`; exported so the substitution
 * logic can be unit-tested without hitting the DB.
 *
 * Order matters: longer / more-specific patterns replace first, so we don't
 * end up turning `www.dremio.com` into `www.meridian.com` before the domain
 * itself gets rewritten.
 */

export const DREMIO_TO_MERIDIAN_SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/www\.dremio\.com/g, "meridian.ai"],
  [/dremio\.com/g, "meridian.ai"],
  [/Dremio/g, "Meridian"],
  [/DREMIO/g, "MERIDIAN"],
  [/dremio/g, "meridian"],
];

export function substituteString(
  s: string,
  rules: Array<[RegExp, string]> = DREMIO_TO_MERIDIAN_SUBSTITUTIONS
): string {
  return rules.reduce((acc, [pat, rep]) => acc.replace(pat, rep), s);
}

export function substituteJson<T>(
  value: T,
  rules: Array<[RegExp, string]> = DREMIO_TO_MERIDIAN_SUBSTITUTIONS
): T {
  if (typeof value === "string") {
    return substituteString(value, rules) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => substituteJson(v, rules)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = substituteJson(v, rules);
    }
    return out as T;
  }
  return value;
}

/**
 * Swap the host of a URL while preserving path, query, and fragment.
 * Forces https and drops any port — meridian.ai doesn't have one.
 * Returns the input unchanged if it doesn't parse as a URL.
 */
export function rewriteUrlHost(url: string, newHost: string): string {
  try {
    const u = new URL(url);
    u.hostname = newHost;
    u.port = "";
    u.protocol = "https:";
    return u.toString();
  } catch {
    return url;
  }
}
