export type RedirectRule = {
  from: string;
  to: string;
  status: number;
};

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "/";
  const trimmed = withoutQuery.trim();
  if (!trimmed) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

function toStatus(value: unknown) {
  const numeric = Number(value);
  if ([301, 302, 307, 308].includes(numeric)) {
    return numeric;
  }
  return 301;
}

function toPath(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return normalizePathname(trimmed);
}

export function parseRedirectRules(input: unknown): RedirectRule[] {
  if (!Array.isArray(input)) return [];
  const result: RedirectRule[] = [];
  const seen = new Set<string>();

  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const from = toPath(row.from);
    const to = toPath(row.to);
    const status = toStatus(row.status);

    if (!from || !to) continue;
    if (from === to) continue;
    const key = `${from}::${to}::${status}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ from, to, status });
  }

  return result;
}

export function resolveRedirect(
  pathname: string,
  rules: RedirectRule[]
): RedirectRule | null {
  if (!pathname || rules.length === 0) return null;
  const normalizedPath = normalizePathname(pathname);
  const match = rules.find((rule) => normalizePathname(rule.from) === normalizedPath);
  if (!match) return null;

  if (!/^https?:\/\//i.test(match.to) && normalizePathname(match.to) === normalizedPath) {
    return null;
  }
  return match;
}

export function shouldSkipRedirect(pathname: string) {
  const normalized = normalizePathname(pathname);
  if (normalized.startsWith("/build")) return true;
  if (normalized.startsWith("/assets")) return true;
  if (normalized.startsWith("/favicon")) return true;
  if (normalized.startsWith("/api/")) return true;
  if (normalized === "/robots.txt" || normalized === "/sitemap.xml") return true;
  return /\.[a-z0-9]+$/i.test(normalized);
}
