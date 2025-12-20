# Product Configurator Backend (Cloudflare Worker)

Backend API for the Product Configurator. Runs as a Cloudflare Worker with a simple router, JSON helpers, and CORS wrapping for all responses.

## What this does

- Handles HTTP requests via a single Worker `fetch()` entrypoint
- Routes requests through `router.handle(req, env, ctx)`
- Adds CORS headers to every response
- Supports `OPTIONS` preflight
- Returns consistent JSON errors for:
  - 404 (route not found)
  - 500 (unexpected error)

## Project structure (high level)

- `src/index.ts` — Worker entry (`fetch`), error handling, CORS wrapping
- `src/routes/router.ts` — request routing (`router.handle`)
- `src/utils/cors.ts` — `withCors`, `corsPreflight`
- `src/utils/json.ts` — `json()` helper for `Response`
- `src/models/types.ts` — shared types, including `Env`

## Request flow
1. `OPTIONS` → `corsPreflight(req, env)`
2. Otherwise → `router.handle(req, env, ctx)`
3. If router returns a `Response`, use it
4. If router returns nothing/unknown → `json({ ok: false, error: "Not found" }, 404)`
5. Wrap final response with `withCors(finalRes, req, env)`
6. On exceptions → `json({ ok: false, error: err.message || "Unexpected error" }, 500)` + CORS

## Response format

Successful endpoints depend on routes
