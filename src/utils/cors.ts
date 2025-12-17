import type { Env } from "../models/types";
import { json } from "./json";

function parseAllowedOrigins(env: Env): string[] {
  const raw = (env.ALLOWED_ORIGINS || "").trim();
  if (!raw) return [];
  return raw.split(",").map(s => s.trim()).filter(Boolean);
}

export function corsHeaders(req: Request, env: Env): Headers {
  const h = new Headers();
  const origin = req.headers.get("Origin") || "";
  const allowed = parseAllowedOrigins(env);

  if (allowed.length && origin && allowed.includes(origin)) {
    h.set("Access-Control-Allow-Origin", origin);
    h.set("Vary", "Origin");
  }

  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Access-Control-Max-Age", "86400");

  return h;
}

export function withCors(res: Response, req: Request, env: Env) {
  const out = new Response(res.body, res);
  const h = corsHeaders(req, env);
  h.forEach((v, k) => out.headers.set(k, v));
  return out;
}

export function corsPreflight(req: Request, env: Env) {
  // If you want stricter behavior, you can reject unknown origins here.
  const h = corsHeaders(req, env);
  return new Response(null, { status: 204, headers: h });
}
