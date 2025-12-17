import type { Env } from "../models/types";
import { json } from "../utils/json";
import { GenerateBaseImageSchema } from "../models/validators";
import { baseImagePrompt } from "../services/prompts";
import { openaiGenerateImage } from "../services/openai";
import { r2Put, publicUrl } from "../services/r2";
import { uuid, isoDateFolder } from "../utils/id";

export async function generateBaseImage(req: Request, env: Env) {
  const body = await req.json().catch(() => null);
  const parsed = GenerateBaseImageSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: parsed.error.flatten() }, 400);

  const { product_name, product_handle, product_type, view_id, decoration_method, style_hint } = parsed.data;

  const prompt = baseImagePrompt({
    product_name,
    product_type,
    view_id,
    decoration_method,
    style_hint,
  });

  const { bytes, contentType } = await openaiGenerateImage(env, {
    prompt,
    size: "1536x1024", // landscape tends to look better for product views
    output_format: "png",
    background: "opaque",
  });

  const handle = (product_handle || "unknown-product").replace(/[^a-z0-9-_]/gi, "-");
  const view = String(view_id).replace(/[^a-z0-9-_]/gi, "-");
  const key = `generated/base/${handle}/${view}/${isoDateFolder()}/${uuid()}.png`;

  await r2Put(env, key, bytes, contentType);

  return json({
    ok: true,
    url: publicUrl(env, key),
    key,
    view_id,
    source: "ai_generated",
  });
}
