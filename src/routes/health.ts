import { json } from "../utils/json";

export function health() {
  return json({ ok: true, service: "designer-api" });
}
