import type { Env } from "../models/types";
const OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_GEN_MODEL = "gpt-image-1.5";
const DEFAULT_EDIT_MODEL = "gpt-image-1";

export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
export type ImageBackground = "auto" | "opaque" | "transparent";
export type ImageOutputFormat = "png" | "jpeg" | "webp";

export type ImageBytesResult = {
  bytes: Uint8Array;
  contentType: string;
  meta?: {
    model: string;
    size: ImageSize;
    background?: ImageBackground;
    outputFormat: ImageOutputFormat;
    endpoint: string;
    requestId?: string | null;
  };
};

type FetchLike = typeof fetch;

type OpenAIErrorPayload = {
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
    param?: string;
  };
  [k: string]: unknown;
};

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    revised_prompt?: string;
  }>;
  [k: string]: unknown;
};

type BaseImageInput = {
  bytes: Uint8Array;
  filename?: string;
  contentType?: string;
};












type ClientOptions = {
  baseUrl?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number; 
  retries?: number; 
  retryDelayMs?: number; 
  userAgent?: string;
};

export type GenerateImageArgs = {
  prompt: string;
  size?: ImageSize;
  model?: string;
  background?: ImageBackground;
  output_format?: ImageOutputFormat;
};

export type EditImageArgs = {
  prompt: string;

  baseImageBytes: Uint8Array;
  baseImageFilename?: string;
  baseImageContentType?: string;

  overlayBytes: Uint8Array;
  overlayFilename?: string;
  overlayContentType?: string;

  size?: ImageSize;
  model?: string;
  output_format?: ImageOutputFormat;
  background?: ImageBackground;
};

function requireEnvKey(env: Env): string {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) throw new Error("Missing OPENAI_API_KEY");
  return key;
}

function buildAuthHeaders(env: Env): Record<string, string> {
  const key = requireEnvKey(env);
  return { Authorization: `Bearer ${key}` };
}












