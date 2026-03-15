const PSI_API_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export async function runPageSpeedInsights(
  url: string,
  strategy: "mobile" | "desktop"
): Promise<number | null> {
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const params = new URLSearchParams({
        url,
        strategy,
        key: apiKey,
        category: "performance",
      });

      const res = await fetch(`${PSI_API_URL}?${params}`, {
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        if (attempt === 0) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        return null;
      }

      const data = await res.json();
      const score =
        data?.lighthouseResult?.categories?.performance?.score;

      if (typeof score !== "number") return null;
      return Math.round(score * 100);
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      return null;
    }
  }

  return null;
}
