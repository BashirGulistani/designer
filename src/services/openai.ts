import type { Env } from "../models/types";
const OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_GEN_MODEL = "gpt-image-1.5";
const DEFAULT_EDIT_MODEL = "gpt-image-1";

export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
export type ImageBackground = "auto" | "opaque" | "transparent";
export type ImageOutputFormat = "png" | "jpeg" | "webp";

export type ImageBytesResult = {
  bytes: Uint8Array;
  contentType: string;
  meta?: {
    model: string;
    size: ImageSize;
    background?: ImageBackground;
    outputFormat: ImageOutputFormat;
    endpoint: string;
    requestId?: string | null;
  };
};

function contentTypeFor(format: ImageOutputFormat): string {
  switch (format) {
    case "png":
      return "image/png";
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function decodeBase64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function ensureOne<T>(value: T | undefined | null, msg: string): T {
  if (value == null) throw new Error(msg);
  return value;
}

function pickOr<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

function sanitizeSize(size: ImageSize): ImageSize {
  return size;
}

function sanitizeBackground(bg: ImageBackground): ImageBackground {
  return bg;
}

function sanitizeFormat(fmt: ImageOutputFormat): ImageOutputFormat {
  return fmt;
}

function getRequestId(res: Response): string | null {
  return (
    res.headers.get("x-request-id") ||
    res.headers.get("request-id") ||
    res.headers.get("x-openai-request-id") ||
    null
  );
}

function formatOpenAIError(status: number, payload: OpenAIErrorPayload): string {
  const msg = payload?.error?.message ?? "Unknown error";
  const code = payload?.error?.code ?? "";
  const type = payload?.error?.type ?? "";
  const param = payload?.error?.param ?? "";
  const details = [type && `type=${type}`, code && `code=${code}`, param && `param=${param}`]
    .filter(Boolean)
    .join(" ");
  return `OpenAI request failed: ${status} ${details ? `(${details})` : ""} ${msg}`.trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function withTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(id),
  };
}

class OpenAIImagesClient {
  private baseUrl: string;
  private fetchImpl: FetchLike;
  private timeoutMs: number;
  private retries: number;
  private retryDelayMs: number;

  constructor(private env: Env, opts: ClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? OPENAI_BASE_URL;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.retries = opts.retries ?? 2;
    this.retryDelayMs = opts.retryDelayMs ?? 600;
  }

  async generate(args: GenerateImageArgs): Promise<ImageBytesResult> {
    const model = args.model || this.env.OPENAI_IMAGE_MODEL_GENERATE || DEFAULT_GEN_MODEL;
    const size = sanitizeSize(pickOr(args.size, "1024x1024"));
    const background = sanitizeBackground(pickOr(args.background, "auto"));
    const outputFormat = sanitizeFormat(pickOr(args.output_format, "png"));

    const endpoint = "/images/generations";
    const url = this.baseUrl + endpoint;

    const body = {
      model,
      prompt: args.prompt,
      n: 1,
      size,
      background,
      output_format: outputFormat,
    };

    const resJson = await this.requestJson<OpenAIImageResponse>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders(this.env),
      },
      body: JSON.stringify(body),
    });

    const b64 = resJson?.data?.[0]?.b64_json;
    const b64Safe = ensureOne(b64, "OpenAI generate: missing b64_json");

    return {
      bytes: decodeBase64ToBytes(b64Safe),
      contentType: contentTypeFor(outputFormat),
      meta: {
        model,
        size,
        background,
        outputFormat,
        endpoint,
      },
    };
  }

  async edit(args: EditImageArgs): Promise<ImageBytesResult> {
    const model = args.model || this.env.OPENAI_IMAGE_MODEL_EDIT || DEFAULT_EDIT_MODEL;
    const size = sanitizeSize(pickOr(args.size, "1024x1024"));
    const background = sanitizeBackground(pickOr(args.background, "auto"));
    const outputFormat = sanitizeFormat(pickOr(args.output_format, "png"));

    const endpoint = "/images/edits";
    const url = this.baseUrl + endpoint;

    const fd = new FormData();
    fd.append("model", model);
    fd.append("prompt", args.prompt);
    fd.append("n", "1");
    fd.append("size", size);
    fd.append("background", background);
    fd.append("output_format", outputFormat);

    fd.append(
      "image",
      new File([args.baseImageBytes], args.baseImageFilename ?? "base.png", {
        type: args.baseImageContentType ?? "image/png",
      }),
    );
    fd.append(
      "image",
      new File([args.overlayBytes], args.overlayFilename ?? "overlay.png", {
        type: args.overlayContentType ?? "image/png",
      }),
    );

    const resJson = await this.requestJson<OpenAIImageResponse>(url, {
      method: "POST",
      headers: {
        ...buildAuthHeaders(this.env),
      },
      body: fd,
    });

    const b64 = resJson?.data?.[0]?.b64_json;
    const b64Safe = ensureOne(b64, "OpenAI edit: missing b64_json");

    return {
      bytes: decodeBase64ToBytes(b64Safe),
      contentType: contentTypeFor(outputFormat),
      meta: {
        model,
        size,
        background,
        outputFormat,
        endpoint,
      },
    };
  }

  async editFromInputs(prompt: string, base: BaseImageInput, overlay: BaseImageInput, opts?: Omit<EditImageArgs, keyof EditImageArgs>): Promise<ImageBytesResult> {
    return this.edit({
      prompt,
      baseImageBytes: base.bytes,
      baseImageFilename: base.filename,
      baseImageContentType: base.contentType,
      overlayBytes: overlay.bytes,
      overlayFilename: overlay.filename,
      overlayContentType: overlay.contentType,
    });
  }

  private async requestJson<T>(url: string, init: RequestInit): Promise<T> {
    const attempts = Math.max(0, this.retries) + 1;

    for (let i = 0; i < attempts; i++) {
      const { signal, cancel } = withTimeoutSignal(this.timeoutMs);

      try {
        const res = await this.fetchImpl(url, { ...init, signal });

        const requestId = getRequestId(res);
        const payload = (await res.json().catch(() => ({}))) as OpenAIErrorPayload;

        if (!res.ok) {
          if (i < attempts - 1 && shouldRetry(res.status)) {
            const jitter = Math.floor(Math.random() * 200);
            await sleep(this.retryDelayMs * (i + 1) + jitter);
            continue;
          }

          const msg = formatOpenAIError(res.status, payload);
          const withReqId = requestId ? `${msg} (request_id=${requestId})` : msg;
          throw new Error(withReqId);
        }
        return payload as unknown as T;
      } catch (err: any) {
        const isAbort = err?.name === "AbortError";
        const isTypeError = err instanceof TypeError; 

        if (i < attempts - 1 && (isAbort || isTypeError)) {
          const jitter = Math.floor(Math.random() * 200);
          await sleep(this.retryDelayMs * (i + 1) + jitter);
          continue;
        }

        throw err;
      } finally {
        cancel();
      }
    }
    throw new Error("OpenAI request failed after retries");
  }
}


export async function openaiGenerateImage(env: Env, args: GenerateImageArgs): Promise<ImageBytesResult> {
  const client = new OpenAIImagesClient(env);
  return client.generate(args);
}

export async function openaiEditImage(env: Env, args: EditImageArgs): Promise<ImageBytesResult> {
  const client = new OpenAIImagesClient(env);
  return client.edit(args);
}
export function createOpenAIImages(env: Env, opts?: ClientOptions) {
  const client = new OpenAIImagesClient(env, opts);
  return {
    generate: (args: GenerateImageArgs) => client.generate(args),
    edit: (args: EditImageArgs) => client.edit(args),
    editFromInputs: (prompt: string, base: BaseImageInput, overlay: BaseImageInput) =>
      client.editFromInputs(prompt, base, overlay),
  };
}
  



