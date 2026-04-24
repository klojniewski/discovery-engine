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

/**
 * Anonymizes real Dremio employees who appear as page authors, bylines, and
 * image filenames in the cloned content. Mapping uses plausible fictional
 * names of similar length so prose reads naturally.
 *
 * Order: spaced → hyphenated (capitalized) → lowercase-slug → standalone
 * last name → standalone first name. Standalone "Merced" is deliberately
 * NOT rewritten — it's also a California city name and every confirmed
 * occurrence in the source data is paired with "Alex" and caught above.
 */
export const AUTHOR_ANONYMIZATION_SUBSTITUTIONS: Array<[RegExp, string]> = [
  // Full names — spaced, hyphenated capitalized, lowercase slug
  [/Aalhad Kulkarni/g, "Aisha Patel"],
  [/Alex Merced/g, "Sam Chen"],
  [/Aniket Kulkarni/g, "Arjun Kapoor"],
  [/Aalhad-Kulkarni/g, "Aisha-Patel"],
  [/Alex-Merced/g, "Sam-Chen"],
  [/Aniket-Kulkarni/g, "Arjun-Kapoor"],
  [/aalhad-kulkarni/g, "aisha-patel"],
  [/alex-merced/g, "sam-chen"],
  [/aniket-kulkarni/g, "arjun-kapoor"],
  // Standalone surnames — after all full-name forms are consumed
  [/Kulkarni/g, "Patel"],
  // Standalone given names
  [/Aalhad/g, "Aisha"],
  [/Aniket/g, "Arjun"],
];

/**
 * "Gnarly Data Waves" is Dremio's branded podcast; rebrand to generic
 * "Podcast" for the demo. Covers prose, hyphenated filenames, and URL slugs.
 */
export const GNARLY_TO_PODCAST_SUBSTITUTIONS: Array<[RegExp, string]> = [
  // Covers all-caps heading, title case, all-lowercase (transcript prose),
  // hyphenated (filenames), URL slug, URL-encoded title in share links,
  // and underscored filename variants.
  // Note: rebrands only the podcast title "Gnarly Data Waves" — the bare
  // "Gnarly" mascot is intentionally left alone; user didn't ask to
  // rename the mascot and touching it risks a lot of weird prose.
  [/GNARLY DATA WAVES/g, "PODCAST"],
  [/Gnarly Data Waves/g, "Podcast"],
  [/gnarly data waves/g, "podcast"],
  [/Gnarly%20Data%20Waves/g, "Podcast"],
  [/Gnarly-Data-Waves/g, "Podcast"],
  [/gnarly-data-waves/g, "podcast"],
  [/Gnarly_Data_Waves/g, "Podcast"],
  [/gnarly_data_waves/g, "podcast"],
];

/**
 * Rebrand references to NetApp (a real storage vendor frequently cited in
 * the source content and shown as a partner page) to a fictional "Vercell"
 * so the demo doesn't implicitly associate the Meridian brand with a
 * real-world vendor relationship.
 */
export const NETAPP_TO_VERCELL_SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/NETAPP/g, "VERCELL"],
  [/NetApp/g, "Vercell"],
  [/Netapp/g, "Vercell"],
  [/netApp/g, "vercell"], // camelCase form seen in image filenames
  [/netapp/g, "vercell"],
];

/**
 * Full substitution list applied when cloning a Dremio project into a
 * Meridian demo. Order is significant across list boundaries too — brand
 * rules replace host names before author/podcast rules sweep word-level
 * content, so we don't end up with half-rebranded URLs.
 */
export const DEMO_PROJECT_SUBSTITUTIONS: Array<[RegExp, string]> = [
  ...DREMIO_TO_MERIDIAN_SUBSTITUTIONS,
  ...AUTHOR_ANONYMIZATION_SUBSTITUTIONS,
  ...GNARLY_TO_PODCAST_SUBSTITUTIONS,
  ...NETAPP_TO_VERCELL_SUBSTITUTIONS,
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
