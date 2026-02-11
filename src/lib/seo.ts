export const CANONICAL_ORIGIN = "https://www.ayzalcollections.com";

export const DEFAULT_OG_IMAGE_PATH = "/og.png";
export const DEFAULT_OG_IMAGE_URL = `${CANONICAL_ORIGIN}${DEFAULT_OG_IMAGE_PATH}`;

export const DEFAULT_HOME_SEO = {
  title: "Ayzal Collections | Pakistani Dresses",
  description:
    "Discover Ayzal Collections for pakistani dresses, buy pakistani dresses in lahore, lawn, unstitched lawn, and designer lawn pakistan. Elegant unstitched suits crafted for timeless style.",
  keywords:
    "pakistani dresses, buy pakistani dresses in lahore, lawn, unstitched lawn, designer lawn pakistan",
};

export function canonicalUrl(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (normalized === "/") {
    return `${CANONICAL_ORIGIN}/`;
  }
  return `${CANONICAL_ORIGIN}${normalized}`;
}

export function toAbsoluteUrl(value: string | null | undefined) {
  if (!value) return DEFAULT_OG_IMAGE_URL;
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${CANONICAL_ORIGIN}${path}`;
}
