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






