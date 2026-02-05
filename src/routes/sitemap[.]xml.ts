import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";

const CANONICAL_BASE = "https://ayzalcollections.com";

const formatDate = (value?: number) => {
  if (!value) return undefined;
  return new Date(value).toISOString();
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const convex = createConvexClient(context);
  const [products, categories] = await Promise.all([
    convex.query(api.products.listSeo),
    convex.query(api.categories.listSeo),
  ]);

  const urls = [
    { loc: `${CANONICAL_BASE}/`, lastmod: new Date().toISOString() },
    ...(categories ?? []).map((category) => ({
      loc: `${CANONICAL_BASE}/category/${category.slug}`,
      lastmod: formatDate(category.updated_at),
    })),
    ...(products ?? []).map((product) => ({
      loc: `${CANONICAL_BASE}/product/${product.slug}`,
      lastmod: formatDate(product.updated_at),
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((url) => {
        const lastmod = url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : "";
        return `  <url><loc>${url.loc}</loc>${lastmod}</url>`;
      })
      .join("\n") +
    "\n</urlset>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};

