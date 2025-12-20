import type { Env } from "../models/types";

const OPENAI_BASE = "https://api.openai.com/v1";

function authHeaders(env: Env) {
  if (!env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
  return {
    Authorization: `Bearer ${env.OPENAI_API_KEY}`,
  };
}

export async function openaiGenerateImage(env: Env, args: {
  prompt: string;
  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  model?: string;
  background?: "auto" | "opaque" | "transparent";
  output_format?: "png" | "jpeg" | "webp";
}) {
  const body = {
    model: args.model || env.OPENAI_IMAGE_MODEL_GENERATE || "gpt-image-1.5",
    prompt: args.prompt,
    n: 1,
    size: args.size || "1024x1024",
    background: args.background || "auto",
    output_format: args.output_format || "png",
  };

  const res = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(env),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(`OpenAI generate failed: ${res.status} ${JSON.stringify(json)}`);

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI generate: missing b64_json");

  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return { bytes, contentType: "image/png" };
}

export async function openaiEditImage(env: Env, args: {
  prompt: string;
  baseImageBytes: Uint8Array;
  baseImageFilename?: string;
  baseImageContentType?: string;
  overlayBytes: Uint8Array;
  overlayFilename?: string;
  overlayContentType?: string;

  size?: "1024x1024" | "1536x1024" | "1024x1536" | "auto";
  model?: string;
  output_format?: "png" | "jpeg" | "webp";
  background?: "auto" | "opaque" | "transparent";
}) {
  const model = args.model || env.OPENAI_IMAGE_MODEL_EDIT || "gpt-image-1";

  const fd = new FormData();
  fd.append("model", model);
  fd.append("prompt", args.prompt);
  fd.append("n", "1");
  fd.append("size", args.size || "1024x1024");
  fd.append("output_format", args.output_format || "png");
  fd.append("background", args.background || "auto");

  fd.append(
    "image",
    new File([args.baseImageBytes], args.baseImageFilename || "base.png", {
      type: args.baseImageContentType || "image/png",
    })
  );
  fd.append(
    "image",
    new File([args.overlayBytes], args.overlayFilename || "overlay.png", {
      type: args.overlayContentType || "image/png",
    })
  );

  const res = await fetch(`${OPENAI_BASE}/images/edits`, {
    method: "POST",
    headers: {
      ...authHeaders(env),
    },
    body: fd,
  });

  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(`OpenAI edit failed: ${res.status} ${JSON.stringify(json)}`);

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI edit: missing b64_json");

  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return { bytes, contentType: "image/png" };
}
