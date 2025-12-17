import type { Env } from "../models/types";
import { json } from "../utils/json";
import { EnhanceMockupSchema } from "../models/validators";
import { enhancePrompt } from "../services/prompts";
import { openaiEditImage } from "../services/openai";
import { r2Put, publicUrl } from "../services/r2";
import { uuid, isoDateFolder } from "../utils/id";
import { dataUrlToBytes, fetchBytes } from "../utils/bytes";

export async function enhanceMockup(req: Request, env: Env) {
  const body = await req.json().catch(() => null);
  const parsed = EnhanceMockupSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: parsed.error.flatten() }, 400);

  const {
    base_image_url,
    overlay_png_base64,
    decoration_method,
    location,
    product_handle,
    view_id
  } = parsed.data;

  // 1) Fetch base image bytes
  const base = await fetchBytes(base_image_url);

  // 2) Decode overlay PNG (transparent design only)
  const overlay = dataUrlToBytes(overlay_png_base64);

  // 3) Ask model to apply overlay realistically (print/embroidery/etc.)
  const prompt = enhancePrompt({ decoration_method, location });

  const out = await openaiEditImage(env, {
    prompt,
    baseImageBytes: base.bytes,
    baseImageContentType: base.contentType,
    baseImageFilename: "base.png",

    overlayBytes: overlay.bytes,
    overlayContentType: overlay.mime,
    overlayFilename: "overlay.png",

    size: "1536x1024",
    output_format: "png",
    background: "opaque",
  });

  const handle = (product_handle || "unknown-product").replace(/[^a-z0-9-_]/gi, "-");
  const view = String(view_id || "view").replace(/[^a-z0-9-_]/gi, "-");
  const key = `generated/enhanced/${handle}/${view}/${isoDateFolder()}/${uuid()}.png`;

  await r2Put(env, key, out.bytes, out.contentType);

  return json({
    ok: true,
    url: publicUrl(env, key),
    key,
  });
}
