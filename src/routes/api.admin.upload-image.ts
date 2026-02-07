import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { requireAdminRequest } from "@/lib/admin.server";
import { buildRateLimitHeaders, checkRequestRateLimit } from "@/lib/rate-limit.server";
import { getServerEnv } from "@/lib/webhook.server";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function getUploadLimit(env: Record<string, string | undefined>) {
  const raw = Number(env.IMAGE_UPLOAD_MAX_BYTES ?? "");
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_MAX_UPLOAD_BYTES;
  return Math.floor(raw);
}

function toNonEmptyString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeWorkerBase(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const rateLimit = checkRequestRateLimit({
    request,
    namespace: "admin:image-upload",
    max: 60,
    windowMs: 60_000,
    scope: "path-and-ip",
  });
  const rateHeaders = buildRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return json(
      { ok: false, error: "Rate limit exceeded. Please wait a minute and try again." },
      { status: 429, headers: rateHeaders }
    );
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405, headers: rateHeaders });
  }

  try {
    await requireAdminRequest(request, context);

    const env = getServerEnv(context);
    const workerUrl = normalizeWorkerBase((env.IMAGE_UPLOAD_WORKER_URL ?? "").trim());
    const workerToken = (env.IMAGE_UPLOAD_WORKER_TOKEN ?? "").trim();
    if (!workerUrl || !workerToken) {
      return json(
        {
          ok: false,
          error:
            "Upload service is not configured. Set IMAGE_UPLOAD_WORKER_URL and IMAGE_UPLOAD_WORKER_TOKEN.",
        },
        { status: 500, headers: rateHeaders }
      );
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      return json(
        { ok: false, error: "Please select an image file to upload." },
        { status: 400, headers: rateHeaders }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(fileEntry.type)) {
      return json(
        {
          ok: false,
          error:
            "Unsupported file type. Upload JPG, PNG, WEBP, AVIF, GIF, or SVG images.",
        },
        { status: 415, headers: rateHeaders }
      );
    }

    const maxUploadBytes = getUploadLimit(env);
    if (fileEntry.size > maxUploadBytes) {
      return json(
        {
          ok: false,
          error: `Image is too large. Maximum size is ${Math.ceil(maxUploadBytes / 1024 / 1024)} MB.`,
        },
        { status: 413, headers: rateHeaders }
      );
    }

    const workerFormData = new FormData();
    workerFormData.set("file", fileEntry, fileEntry.name);

    const folder = toNonEmptyString(formData.get("folder"));
    const sectionKey = toNonEmptyString(formData.get("section_key"));
    const fieldPath = toNonEmptyString(formData.get("field_path"));
    if (folder) workerFormData.set("folder", folder);
    if (sectionKey) workerFormData.set("section_key", sectionKey);
    if (fieldPath) workerFormData.set("field_path", fieldPath);

    const upstream = await fetch(`${workerUrl}/v1/images/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${workerToken}`,
      },
      body: workerFormData,
    });

    const rawBody = await upstream.text();
    let payload: any = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = { raw: rawBody };
    }

    if (!upstream.ok) {
      return json(
        {
          ok: false,
          error: payload?.error ?? `Upload worker request failed (${upstream.status})`,
          details: payload?.details,
        },
        { status: upstream.status, headers: rateHeaders }
      );
    }

    return json(
      {
        ok: true,
        url: payload?.url,
        key: payload?.key,
        content_type: payload?.content_type,
        size: payload?.size,
        uploaded_at: payload?.uploaded_at,
      },
      { headers: rateHeaders }
    );
  } catch (error: unknown) {
    if (error instanceof Response) {
      if (error.status === 403) {
        return json(
          {
            ok: false,
            error: "Your admin session expired. Please sign in again and retry the upload.",
          },
          { status: 403, headers: rateHeaders }
        );
      }
      return error;
    }
    const message = error instanceof Error ? error.message : "Image upload failed";
    return json({ ok: false, error: message }, { status: 500, headers: rateHeaders });
  }
};
