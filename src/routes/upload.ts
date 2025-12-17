import type { Env } from "../models/types";
import { json } from "../utils/json";
import { uuid, isoDateFolder } from "../utils/id";
import { r2Put, publicUrl } from "../services/r2";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB (tune)

export async function upload(req: Request, env: Env) {
  const ct = req.headers.get("Content-Type") || "";
  if (!ct.includes("multipart/form-data")) {
    return json({ ok: false, error: "Expected multipart/form-data" }, 400);
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return json({ ok: false, error: "Missing file field" }, 400);
  }

  if (file.size > MAX_BYTES) {
    return json({ ok: false, error: `File too large (max ${MAX_BYTES} bytes)` }, 413);
  }

  const folder = String(form.get("folder") || "uploads/misc").replace(/^\/+/, "").replace(/\/+$/, "");
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const key = `${folder}/${isoDateFolder()}/${uuid()}.${ext}`;

  const ab = await file.arrayBuffer();
  const bytes = new Uint8Array(ab);
  const contentType = file.type || "application/octet-stream";

  await r2Put(env, key, bytes, contentType);

  return json({
    ok: true,
    key,
    url: publicUrl(env, key),
    contentType,
    bytes: file.size,
  });
}
