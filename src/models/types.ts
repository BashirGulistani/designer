export interface Env {
  ALLOWED_ORIGINS?: string; 
  PUBLIC_ASSET_BASE_URL?: string; 

  DESIGNER_ASSETS: R2Bucket;

  OPENAI_API_KEY: string;
  OPENAI_IMAGE_MODEL_GENERATE?: string; 
  OPENAI_IMAGE_MODEL_EDIT?: string;    
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
