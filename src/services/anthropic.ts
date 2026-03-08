import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { apiUsage } from "@/db/schema";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Pricing per million tokens (as of 2026-03)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5-20251001": { input: 0.80, output: 4.00 },
  "claude-sonnet-4-6": { input: 3.00, output: 15.00 },
};

function calculateCostMicros(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model] ?? { input: 3.0, output: 15.0 };
  const costUsd =
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;
  return Math.round(costUsd * 1_000_000); // store as microdollars for integer precision
}

async function logApiUsage(
  model: string,
  inputTokens: number,
  outputTokens: number,
  projectId?: string,
  step?: string
) {
  try {
    await db.insert(apiUsage).values({
      projectId: projectId ?? null,
      step: step ?? "unknown",
      model,
      inputTokens,
      outputTokens,
      costUsd: calculateCostMicros(model, inputTokens, outputTokens),
    });
  } catch (err) {
    console.error("Failed to log API usage:", err);
  }
}

export interface UsageContext {
  projectId?: string;
  step?: string;
}

interface ClaudeOptions {
  model?: "claude-haiku-4-5-20251001" | "claude-sonnet-4-6";
  maxTokens?: number;
  system?: string;
  usage?: UsageContext;
}

export async function callClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    model = "claude-haiku-4-5-20251001",
    maxTokens = 4096,
    system,
    usage,
  } = options;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: system ?? "You are an expert web analyst. Respond with valid JSON only, no markdown fences.",
    messages: [{ role: "user", content: prompt }],
  });

  await logApiUsage(
    model,
    response.usage.input_tokens,
    response.usage.output_tokens,
    usage?.projectId,
    usage?.step
  );

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

export interface ImageMeta {
  width: number;
  height: number;
}

export async function callClaudeWithImage(
  prompt: string,
  imageUrl: string,
  options: ClaudeOptions & { returnMeta: true }
): Promise<{ text: string; meta: ImageMeta }>;
export async function callClaudeWithImage(
  prompt: string,
  imageUrl: string,
  options?: ClaudeOptions & { returnMeta?: false }
): Promise<string>;
export async function callClaudeWithImage(
  prompt: string,
  imageUrl: string,
  options: ClaudeOptions & { returnMeta?: boolean } = {}
): Promise<string | { text: string; meta: ImageMeta }> {
  const {
    model = "claude-sonnet-4-6",
    maxTokens = 4096,
    system,
    usage,
  } = options;

  // Fetch image, resize if needed (Claude max 8000px per dimension), convert to base64
  const res = await fetch(imageUrl);
  const rawBuffer = Buffer.from(await res.arrayBuffer());
  const rawType = res.headers.get("content-type") ?? "image/png";

  const sharp = (await import("sharp")).default;
  const MAX_DIM = 7900; // slightly under 8000 to be safe

  // Always run through sharp to ensure dimensions are within limits
  const img = sharp(rawBuffer);
  const meta = await img.metadata();
  const needsResize =
    (meta.width != null && meta.width > MAX_DIM) ||
    (meta.height != null && meta.height > MAX_DIM);

  let buffer: Buffer;
  let mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";

  let finalWidth = meta.width ?? 0;
  let finalHeight = meta.height ?? 0;

  if (needsResize) {
    console.log(
      `Resizing image from ${meta.width}x${meta.height} to fit ${MAX_DIM}px limit`
    );
    buffer = await sharp(rawBuffer)
      .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    mediaType = "image/png";
    const resizedMeta = await sharp(buffer).metadata();
    finalWidth = resizedMeta.width ?? 0;
    finalHeight = resizedMeta.height ?? 0;
  } else {
    buffer = rawBuffer;
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    mediaType = (validTypes.includes(rawType) ? rawType : "image/png") as typeof mediaType;
  }

  const base64 = buffer.toString("base64");

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: system ?? "You are an expert UI/UX analyst. Respond with valid JSON only, no markdown fences.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  await logApiUsage(
    model,
    response.usage.input_tokens,
    response.usage.output_tokens,
    usage?.projectId,
    usage?.step
  );

  const textBlock = response.content.find((b) => b.type === "text");
  const text = textBlock?.text ?? "";

  if (options.returnMeta) {
    return { text, meta: { width: finalWidth, height: finalHeight } };
  }
  return text;
}
