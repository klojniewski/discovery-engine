import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface ClaudeOptions {
  model?: "claude-haiku-4-5-20251001" | "claude-sonnet-4-6";
  maxTokens?: number;
  system?: string;
}

export async function callClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    model = "claude-haiku-4-5-20251001",
    maxTokens = 4096,
    system,
  } = options;

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: system ?? "You are an expert web analyst. Respond with valid JSON only, no markdown fences.",
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}

export async function callClaudeWithImage(
  prompt: string,
  imageUrl: string,
  options: ClaudeOptions = {}
): Promise<string> {
  const {
    model = "claude-sonnet-4-6",
    maxTokens = 4096,
    system,
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

  if (needsResize) {
    console.log(
      `Resizing image from ${meta.width}x${meta.height} to fit ${MAX_DIM}px limit`
    );
    buffer = await sharp(rawBuffer)
      .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    mediaType = "image/png";
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

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}
