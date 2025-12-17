export interface Env {
  ALLOWED_ORIGINS?: string; // "https://inkdstores.com,https://www.inkdstores.com,http://localhost:5173"
  PUBLIC_ASSET_BASE_URL?: string; // e.g. "https://assets.inkdstores.com"

  DESIGNER_ASSETS: R2Bucket;

  OPENAI_API_KEY: string;

  // Optional overrides
  OPENAI_IMAGE_MODEL_GENERATE?: string; // default gpt-image-1.5
  OPENAI_IMAGE_MODEL_EDIT?: string;     // default gpt-image-1
}

export type ViewId =
  | "front"
  | "back"
  | "left_sleeve"
  | "right_sleeve"
  | "left_chest"
  | "right_chest"
  | "center_chest"
  | "full_front"
  | "full_back"
  | string;

export type DecorationMethod = string;
export type PrintLocation = string;
