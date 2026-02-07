import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";

function parseCookieHeader(header: string | null) {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const pair of header.split(";")) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function isLocalHostHeader(hostHeader: string | null) {
  if (!hostHeader) return true;
  const host = hostHeader.split(":")[0]?.trim().toLowerCase() ?? "";
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
}

function getBearerTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const [scheme, ...parts] = authHeader.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer") return null;
  const token = parts.join(" ").trim();
  return token || null;
}

export function getConvexAuthTokenFromRequest(request: Request) {
  const bearerToken = getBearerTokenFromRequest(request);
  if (bearerToken) {
    return bearerToken;
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const isLocal = isLocalHostHeader(request.headers.get("host"));
  const prefixedName = `${isLocal ? "" : "__Host-"}__convexAuthJWT`;
  return cookies[prefixedName] ?? cookies.__convexAuthJWT ?? null;
}

export async function isAdminRequest(request: Request, context: unknown) {
  const token = getConvexAuthTokenFromRequest(request);
  if (!token) {
    return false;
  }
  try {
    const convex = createConvexClient(context as any);
    convex.setAuth(token);
    const isAdmin = await convex.query(api.admin.isAdmin);
    return !!isAdmin;
  } catch {
    return false;
  }
}

export async function requireAdminRequest(request: Request, context: unknown) {
  const isAdmin = await isAdminRequest(request, context);
  if (!isAdmin) {
    throw new Response("Forbidden", { status: 403 });
  }
}
