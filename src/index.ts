import { router } from "./routes/router";
import { withCors, corsPreflight } from "./utils/cors";
import type { Env } from "./models/types";
import { json } from "./utils/json";

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      if (req.method === "OPTIONS") return corsPreflight(req, env);

      const res = await router.handle(req, env, ctx);
      const finalRes = res instanceof Response ? res : json({ ok: false, error: "Not found" }, 404);
      return withCors(finalRes, req, env);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Unexpected error";
      return withCors(json({ ok: false, error: msg }, 500), req, env);
    }
  }
};
