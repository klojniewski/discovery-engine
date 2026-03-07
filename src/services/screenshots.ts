import FirecrawlApp from "@mendable/firecrawl-js";
import { createClient } from "@supabase/supabase-js";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "screenshots";

export async function captureScreenshot(url: string): Promise<string | null> {
  try {
    const response = await firecrawl.v1.scrapeUrl(url, {
      formats: ["screenshot"],
    });

    if (!response.success || !response.screenshot) {
      console.warn(`No screenshot for ${url}`);
      return null;
    }

    return response.screenshot;
  } catch (err) {
    console.error(`Screenshot failed for ${url}:`, err);
    return null;
  }
}

export async function uploadScreenshot(
  projectId: string,
  pageId: string,
  screenshotBase64OrUrl: string
): Promise<string | null> {
  try {
    // Firecrawl returns a base64 data URL or a regular URL
    let buffer: Buffer;
    if (screenshotBase64OrUrl.startsWith("data:")) {
      const base64Data = screenshotBase64OrUrl.split(",")[1];
      buffer = Buffer.from(base64Data, "base64");
    } else {
      // It's a URL, fetch it
      const res = await fetch(screenshotBase64OrUrl);
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const path = `${projectId}/${pageId}.png`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error(`Upload failed for ${path}:`, error.message);
      return null;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.error(`Upload failed:`, err);
    return null;
  }
}
