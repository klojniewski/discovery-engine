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

  // Fetch image and convert to base64
  const res = await fetch(imageUrl);
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const rawType = res.headers.get("content-type") ?? "image/png";
  const mediaType = (["image/png", "image/jpeg", "image/webp", "image/gif"].includes(rawType) ? rawType : "image/png") as "image/png" | "image/jpeg" | "image/webp" | "image/gif";

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
