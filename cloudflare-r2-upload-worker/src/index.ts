export interface Env {
  ASSETS_BUCKET: R2Bucket;
  UPLOAD_TOKEN: string;
  PUBLIC_BASE_URL?: string;
  ALLOWED_ORIGINS?: string;
  MAX_UPLOAD_BYTES?: string;
}

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
]);

const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function getAllowedOrigins(env: Env) {
  return (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveCorsOrigin(request: Request, env: Env) {
  const requestOrigin = request.headers.get("Origin");
  const allowedOrigins = getAllowedOrigins(env);
  if (!requestOrigin) {
    return allowedOrigins[0] ?? "*";
  }
  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowedOrigins[0] ?? "*";
}

function corsHeaders(request: Request, env: Env) {
  return {
    "Access-Control-Allow-Origin": resolveCorsOrigin(request, env),
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Upload-Token",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(response: Response, request: Request, env: Env) {
  const headers = new Headers(response.headers);
  const cors = corsHeaders(request, env);
  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getMaxUploadBytes(env: Env) {
  const parsed = Number(env.MAX_UPLOAD_BYTES ?? "");
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_MAX_UPLOAD_BYTES;
  return Math.floor(parsed);
}

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function sanitizeFolderPath(folder: string) {
  const segments = folder
    .split("/")
    .map((segment) => sanitizePathSegment(segment))
    .filter(Boolean);
  return segments.join("/");
}

function extensionFromMimeType(mimeType: string) {
  switch (mimeType.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}

function randomId(bytes = 8) {
  const values = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(values)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function ensureUploadAuthorized(request: Request, env: Env) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const uploadHeader = request.headers.get("X-Upload-Token") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const token = bearerToken || uploadHeader.trim();
  return !!token && token === env.UPLOAD_TOKEN;
}

function encodeObjectKey(key: string) {
  return key
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function buildPublicUrl(request: Request, env: Env, key: string) {
  const encodedKey = encodeObjectKey(key);
  const customBase = (env.PUBLIC_BASE_URL ?? "").trim();
  if (customBase) {
    return `${customBase.replace(/\/$/, "")}/${encodedKey}`;
  }
  const fallback = new URL(`/files/${encodedKey}`, request.url);
  return fallback.toString();
}

async function handleUpload(request: Request, env: Env) {
  if (!ensureUploadAuthorized(request, env)) {
    return json(
      { ok: false, error: "Unauthorized upload request." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return json({ ok: false, error: "Missing `file` in form data." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(fileEntry.type)) {
    return json(
      {
        ok: false,
        error: "Unsupported image type. Allowed: jpg, png, webp, avif, gif, svg.",
      },
      { status: 415 }
    );
  }

  const maxUploadBytes = getMaxUploadBytes(env);
  if (fileEntry.size > maxUploadBytes) {
    return json(
      {
        ok: false,
        error: `Image exceeds upload limit of ${Math.ceil(maxUploadBytes / 1024 / 1024)} MB.`,
      },
      { status: 413 }
    );
  }

  const folderInput = String(formData.get("folder") ?? "sections");
  const sectionKeyInput = String(formData.get("section_key") ?? "");
  const fieldPathInput = String(formData.get("field_path") ?? "");

  const folder = sanitizeFolderPath(folderInput) || "sections";
  const sectionKey = sanitizePathSegment(sectionKeyInput);
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const extension = extensionFromMimeType(fileEntry.type);
  const keyParts = [folder];
  if (sectionKey) keyParts.push(sectionKey);
  keyParts.push(`${yyyy}-${mm}-${dd}`);
  keyParts.push(`${Date.now()}-${randomId(10)}.${extension}`);
  const key = keyParts.join("/");

  await env.ASSETS_BUCKET.put(key, await fileEntry.arrayBuffer(), {
    httpMetadata: {
      contentType: fileEntry.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      original_filename: fileEntry.name,
      section_key: sectionKeyInput.trim(),
      field_path: fieldPathInput.trim(),
      uploaded_at: String(Date.now()),
    },
  });

  return json({
    ok: true,
    key,
    url: buildPublicUrl(request, env, key),
    size: fileEntry.size,
    content_type: fileEntry.type,
    uploaded_at: new Date().toISOString(),
  });
}

async function handleGetFile(request: Request, env: Env, path: string) {
  const encodedKey = path.replace(/^\/files\//, "");
  if (!encodedKey) {
    return json({ ok: false, error: "File key is required." }, { status: 400 });
  }

  const key = encodedKey
    .split("/")
    .map((part) => decodeURIComponent(part))
    .join("/");
  const object = await env.ASSETS_BUCKET.get(key);
  if (!object) {
    return json({ ok: false, error: "File not found." }, { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return withCors(new Response(null, { status: 204 }), request, env);
    }

    try {
      if (request.method === "POST" && path === "/v1/images/upload") {
        return withCors(await handleUpload(request, env), request, env);
      }

      if (request.method === "GET" && path.startsWith("/files/")) {
        return withCors(await handleGetFile(request, env, path), request, env);
      }

      return withCors(
        json({ ok: false, error: "Not found." }, { status: 404 }),
        request,
        env
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected upload worker error.";
      return withCors(json({ ok: false, error: message }, { status: 500 }), request, env);
    }
  },
};
