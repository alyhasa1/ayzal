function normalizeSignature(value: string) {
  return value
    .trim()
    .replace(/^sha256=/i, "")
    .replace(/^v1=/i, "")
    .split(",")[0]
    .trim();
}

function timingSafeEqualText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

function toHex(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out;
}

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const anyGlobal = globalThis as any;
  if (typeof anyGlobal.btoa === "function") return anyGlobal.btoa(binary);
  if (anyGlobal.Buffer) return anyGlobal.Buffer.from(binary, "binary").toString("base64");
  return "";
}

export function getServerEnv(context: any) {
  return ((context?.cloudflare?.env ?? process.env) || {}) as Record<
    string,
    string | undefined
  >;
}

export async function readWebhookPayload(request: Request) {
  const rawBody = await request.text();
  const payload = rawBody ? JSON.parse(rawBody) : {};
  return { rawBody, payload };
}

export async function verifyWebhookSignature({
  rawBody,
  secret,
  signature,
}: {
  rawBody: string;
  secret?: string;
  signature?: string | null;
}) {
  if (!secret) {
    return { valid: false, reason: "missing_secret" as const };
  }
  if (!signature) {
    return { valid: false, reason: "missing_signature" as const };
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedHex = toHex(digest);
  const expectedBase64 = toBase64(digest);
  const normalized = normalizeSignature(signature);
  const valid =
    timingSafeEqualText(normalized.toLowerCase(), expectedHex.toLowerCase()) ||
    timingSafeEqualText(normalized, expectedBase64);

  return {
    valid,
    reason: valid ? ("ok" as const) : ("signature_mismatch" as const),
  };
}
