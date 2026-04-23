import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

const api = firecrawl.v1;

// Cap on browsers Firecrawl uses for crawl jobs. Leaves headroom on the team's
// concurrent-browser pool for ad-hoc screenshot and re-scrape calls that run
// against the same API key while a crawl is in flight.
const MAX_CONCURRENCY = Number(process.env.FIRECRAWL_MAX_CONCURRENCY ?? 5);

interface CrawlOptions {
  url: string;
  limit?: number;
  excludePaths?: string[];
}

export async function startCrawl({ url, limit = 500, excludePaths }: CrawlOptions) {
  const response = await api.asyncCrawlUrl(url, {
    limit,
    excludePaths: excludePaths?.length ? excludePaths : undefined,
    maxConcurrency: MAX_CONCURRENCY,
    scrapeOptions: {
      formats: ["markdown", "html"],
    },
  });

  if (!response.success) {
    throw new Error(`Firecrawl crawl failed: ${response.error}`);
  }

  return { jobId: response.id! };
}

export interface CrawlStatusResult {
  status: "scraping" | "completed" | "failed" | "cancelled";
  total: number;
  completed: number;
  creditsUsed: number;
  data: CrawlPage[];
  next?: string;
}

export interface CrawlPage {
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    ogTitle?: string;
    ogDescription?: string;
    [key: string]: unknown;
  };
}

export async function getCrawlStatus(jobId: string): Promise<CrawlStatusResult> {
  const response = await api.checkCrawlStatus(jobId);

  if (!response.success) {
    throw new Error(`Failed to check crawl status: ${response.error}`);
  }

  return {
    status: response.status as CrawlStatusResult["status"],
    total: response.total ?? 0,
    completed: response.completed ?? 0,
    creditsUsed: response.creditsUsed ?? 0,
    data: (response.data ?? []) as CrawlPage[],
    next: response.next,
  };
}

export async function getAllCrawlResults(jobId: string): Promise<CrawlPage[]> {
  const response = await api.checkCrawlStatus(jobId, true);

  if (!response.success) {
    throw new Error(`Failed to get crawl results: ${response.error}`);
  }

  return (response.data ?? []) as CrawlPage[];
}

export async function scrapeUrl(
  url: string
): Promise<{ markdown?: string; html?: string } | null> {
  try {
    const response = await api.scrapeUrl(url, {
      formats: ["markdown", "html"],
    });

    if (!response.success) {
      console.warn(`Scrape failed for ${url}: ${response.error}`);
      return null;
    }

    return {
      markdown: response.markdown,
      html: response.html,
    };
  } catch (err) {
    console.error(`Scrape error for ${url}:`, err);
    return null;
  }
}
