export function json(data: unknown, status = 200, headersInit?: HeadersInit) {
  const headers = new Headers(headersInit);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}
