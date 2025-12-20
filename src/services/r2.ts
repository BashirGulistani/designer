import type { Env } from "../models/types";

export async function r2Put(
  env: Env,
  key: string,
  bytes: Uint8Array,
  contentType: string
) {
  await env.DESIGNER_ASSETS.put(key, bytes, {
    httpMetadata: { contentType },
  });
  return key;
}

export function publicUrl(env: Env, key: string) {
  const base = (env.PUBLIC_ASSET_BASE_URL || "").replace(/\/+$/, "");
  if (!base) {
    return `r2://${key}`;
  }
  return `${base}/${key}`;
}
