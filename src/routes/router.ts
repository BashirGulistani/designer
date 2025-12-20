import { Router } from "itty-router";
import type { Env } from "../models/types";
import { health } from "./health";
import { upload } from "./upload";
import { generateBaseImage } from "./generateBaseImage";
import { enhanceMockup } from "./enhanceMockup";

export const router = Router<Request, [Env, ExecutionContext]>();

router.get("/health", health);
router.post("/upload", upload);
router.post("/generate-base-image", generateBaseImage);
router.post("/enhance-mockup", enhanceMockup);

router.all("*", () => new Response("Not found", { status: 404 }));
