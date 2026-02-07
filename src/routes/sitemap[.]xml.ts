import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";

const CANONICAL_BASE = "https://ayzalcollections.com";

const formatDate = (value?: number) => {
  if (!value) return undefined;
  return new Date(value).toISOString();
};

const escapeXml = (str: string) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
  image?: { loc: string; caption: string };
};

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const convex = createConvexClient(context);
  const [products, categories, collections, blogPosts, contentPages] = await Promise.all([
    convex.query(api.products.listSeo),
    convex.query(api.categories.listSeo),
    convex.query(api.collections.listPublic),
    convex.query(api.content.listSeoPosts),
    convex.query(api.content.listSeoPages),
  ]);

  const urls: SitemapUrl[] = [
    {
      loc: `${CANONICAL_BASE}/`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: "1.0",
    },
    ...(categories ?? []).map((category) => ({
      loc: `${CANONICAL_BASE}/category/${category.slug}`,
      lastmod: formatDate(category.updated_at),
      changefreq: "weekly",
      priority: "0.7",
    })),
    ...(collections ?? []).map((collection) => ({
      loc: `${CANONICAL_BASE}/collections/${collection.slug}`,
      lastmod: formatDate(collection.updated_at),
      changefreq: "weekly",
      priority: "0.7",
    })),
    ...(products ?? []).map((product) => ({
      loc: `${CANONICAL_BASE}/product/${product.slug}`,
      lastmod: formatDate(product.updated_at),
      changefreq: "weekly",
      priority: "0.8",
      image: product.primary_image_url
        ? { loc: product.primary_image_url, caption: product.name }
        : undefined,
    })),
    {
      loc: `${CANONICAL_BASE}/blog`,
      changefreq: "weekly",
      priority: "0.6",
    },
    ...(blogPosts ?? []).map((post) => ({
      loc: `${CANONICAL_BASE}/blog/${post.slug}`,
      lastmod: formatDate(post.updated_at),
      changefreq: "weekly",
      priority: "0.6",
    })),
    ...(contentPages ?? []).map((page) => ({
      loc: `${CANONICAL_BASE}/pages/${page.slug}`,
      lastmod: formatDate(page.updated_at),
      changefreq: "monthly",
      priority: "0.5",
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n` +
    `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls
      .map((url) => {
        const lastmod = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : "";
        const imageTag = url.image
          ? `\n    <image:image>\n      <image:loc>${escapeXml(url.image.loc)}</image:loc>\n      <image:caption>${escapeXml(url.image.caption)}</image:caption>\n    </image:image>`
          : "";
        return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${lastmod}\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>${imageTag}\n  </url>`;
      })
      .join("\n") +
    "\n</urlset>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
