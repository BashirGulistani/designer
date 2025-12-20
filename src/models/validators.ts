import { z } from "zod";

export const UploadQuerySchema = z.object({
  folder: z.string().optional(), 
});

export const GenerateBaseImageSchema = z.object({
  product_name: z.string().min(1),
  product_handle: z.string().min(1).optional(),
  product_type: z.string().optional(),
  view_id: z.string().min(1),
  decoration_method: z.string().optional(),
  style_hint: z.string().optional(),
});

export const EnhanceMockupSchema = z.object({
  product_handle: z.string().optional(),
  view_id: z.string().optional(),

  base_image_url: z.string().url(),
  overlay_png_base64: z.string().min(20),

  decoration_method: z.string().min(1),
  location: z.string().min(1),
});
