import { query } from "./_generated/server";
import { v } from "convex/values";

const SETTINGS_KEY = "default";

type ContentRecord = Record<string, unknown>;
type LinkIssue = {
  source: string;
  href: string;
  normalized: string;
  reason: string;
};
type RedirectIssue = {
  type: string;
  message: string;
  from?: string;
  to?: string;
  status?: number;
};
type DataIssue = {
  source: string;
  message: string;
};

const fallbackContentPages: ContentRecord[] = [
  {
    slug: "about-us",
    title: "About Ayzal Collections",
    meta_title: "About Ayzal Collections",
    meta_description:
      "Learn about Ayzal Collections, our quality process, and our customer-first design values.",
    body:
      "Ayzal Collections creates Pakistani fashion that balances craftsmanship, comfort, and everyday elegance.\n\nEvery product is reviewed for fit, finish, and fabric quality before launch.",
    updated_at: Date.now(),
    published: true,
  },
  {
    slug: "returns-policy",
    title: "Returns and Exchange Policy",
    meta_title: "Returns and Exchange Policy | Ayzal Collections",
    meta_description:
      "Read return, exchange, and refund eligibility details for Ayzal Collections orders.",
    body:
      "Returns can be requested within 7 days of delivery for eligible, unused items.\n\nFinal sale and customized products are excluded unless damaged or incorrect.",
    updated_at: Date.now(),
    published: true,
  },
  {
    slug: "size-guide",
    title: "Size Guide",
    meta_title: "Size Guide | Ayzal Collections",
    meta_description: "Use the Ayzal size guide to choose the right fit with confidence.",
    body:
      "Use your bust, waist, and hip measurements before checkout.\n\nIf you are between sizes, choose the larger size for comfort tailoring.",
    updated_at: Date.now(),
    published: true,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    meta_title: "FAQ | Ayzal Collections",
    meta_description:
      "Answers to common questions about shipping, delivery timelines, returns, and payment methods.",
    body:
      "Orders are usually processed within 24 hours on working days.\n\nFor urgent support, contact us with your order number through the support page.",
    updated_at: Date.now(),
    published: true,
  },
];

const fallbackBlogPosts: ContentRecord[] = [
  {
    slug: "how-to-style-unstitched-lawn-in-pakistan",
    title: "How to Style Unstitched Lawn in Pakistan",
    excerpt:
      "Simple styling rules to improve fit, comfort, and occasion-ready looks for summer lawn.",
    content:
      "Start by selecting cuts that match your daily routine and weather comfort.\n\nBalance embroidery-heavy shirts with simpler trousers and lightweight dupattas for breathable styling.",
    author: "Ayzal Editorial",
    tags: ["lawn", "styling", "pakistan"],
    cover_image:
      "https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg",
    published_at: Date.now(),
    updated_at: Date.now(),
    published: true,
  },
  {
    slug: "bridal-fabric-checklist-before-you-buy",
    title: "Bridal Fabric Checklist Before You Buy",
    excerpt:
      "A practical checklist to evaluate bridal fabrics, embroidery density, and durability before purchase.",
    content:
      "Inspect fabric fall and lining compatibility before finalizing bridal outfits.\n\nFor heavy embellishments, confirm stitch reinforcement and cleaning instructions in advance.",
    author: "Ayzal Editorial",
    tags: ["bridal", "fabric", "shopping-guide"],
    cover_image: "https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064",
    published_at: Date.now(),
    updated_at: Date.now(),
    published: true,
  },
];

function normalizeSlug(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  const clean = pathname.split("?")[0]?.split("#")[0]?.trim() ?? "/";
  if (!clean) return "/";
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  if (withSlash.length > 1 && withSlash.endsWith("/")) {
    return withSlash.slice(0, -1);
  }
  return withSlash;
}

function toFooterLinkHref(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.startsWith("/") ? trimmed : "";
  }
  if (!value || typeof value !== "object") return "";
  const row = value as Record<string, unknown>;
  if (typeof row.href !== "string") return "";
  return row.href.trim();
}

function isInternalHref(href: string) {
  if (!href) return false;
  if (!href.startsWith("/")) return false;
  return !href.startsWith("//");
}

function parseRedirectRules(input: unknown) {
  if (!Array.isArray(input)) return [] as Array<{ from: string; to: string; status: number }>;
  const result: Array<{ from: string; to: string; status: number }> = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.from !== "string" || typeof row.to !== "string") continue;
    const from = normalizePath(row.from.trim());
    const to = row.to.trim();
    const statusNumber = Number(row.status);
    const status = [301, 302, 307, 308].includes(statusNumber) ? statusNumber : 301;
    if (!from || !to) continue;
    result.push({ from, to, status });
  }
  return result;
}

function toNumberTimestamp(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsedAsNumber = Number(value);
    if (Number.isFinite(parsedAsNumber)) {
      return parsedAsNumber;
    }
    const parsedAsDate = Date.parse(value);
    if (Number.isFinite(parsedAsDate)) {
      return parsedAsDate;
    }
  }
  return fallback;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function toContentArray(value: unknown) {
  if (!Array.isArray(value)) return [] as ContentRecord[];
  return value.filter(
    (item): item is ContentRecord =>
      typeof item === "object" && item !== null && !Array.isArray(item)
  );
}

async function loadSettingsData(ctx: any) {
  const settings = await ctx.db
    .query("site_settings")
    .withIndex("by_key", (q: any) => q.eq("key", SETTINGS_KEY))
    .unique();
  if (!settings || typeof settings.data !== "object" || settings.data === null) {
    return {} as ContentRecord;
  }
  return settings.data as ContentRecord;
}

function normalizeBlogPost(input: ContentRecord, now: number) {
  const slug = normalizeSlug(input.slug);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!slug || !title) return null;

  const publishedAt = toNumberTimestamp(input.published_at, now);
  return {
    slug,
    title,
    excerpt: typeof input.excerpt === "string" ? input.excerpt.trim() : "",
    content: typeof input.content === "string" ? input.content.trim() : "",
    author: typeof input.author === "string" ? input.author.trim() : "Ayzal Editorial",
    cover_image:
      typeof input.cover_image === "string" ? input.cover_image.trim() : undefined,
    tags: toStringArray(input.tags),
    published: input.published !== false,
    published_at: publishedAt,
    updated_at: toNumberTimestamp(input.updated_at, publishedAt),
    meta_title:
      typeof input.meta_title === "string" ? input.meta_title.trim() : undefined,
    meta_description:
      typeof input.meta_description === "string"
        ? input.meta_description.trim()
        : undefined,
    canonical_url:
      typeof input.canonical_url === "string" ? input.canonical_url.trim() : undefined,
    noindex: input.noindex === true,
  };
}

function normalizeContentPage(input: ContentRecord, now: number) {
  const slug = normalizeSlug(input.slug);
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!slug || !title) return null;

  return {
    slug,
    title,
    body: typeof input.body === "string" ? input.body.trim() : "",
    published: input.published !== false,
    updated_at: toNumberTimestamp(input.updated_at, now),
    meta_title:
      typeof input.meta_title === "string" ? input.meta_title.trim() : undefined,
    meta_description:
      typeof input.meta_description === "string"
        ? input.meta_description.trim()
        : undefined,
    canonical_url:
      typeof input.canonical_url === "string" ? input.canonical_url.trim() : undefined,
    noindex: input.noindex === true,
  };
}

export const listPosts = query({
  handler: async (ctx) => {
    const now = Date.now();
    const data = await loadSettingsData(ctx);
    const sourcePosts = toContentArray(data.blog_posts);
    const records = sourcePosts.length > 0 ? sourcePosts : fallbackBlogPosts;
    return records
      .map((item) => normalizeBlogPost(item, now))
      .filter((item): item is NonNullable<typeof item> => !!item && item.published)
      .sort((a, b) => b.published_at - a.published_at)
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        excerpt: item.excerpt,
        cover_image: item.cover_image,
        author: item.author,
        tags: item.tags,
        published_at: item.published_at,
        updated_at: item.updated_at,
      }));
  },
});

export const getPostBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const slug = normalizeSlug(args.slug);
    if (!slug) return null;

    const data = await loadSettingsData(ctx);
    const sourcePosts = toContentArray(data.blog_posts);
    const records = sourcePosts.length > 0 ? sourcePosts : fallbackBlogPosts;
    const posts = records
      .map((item) => normalizeBlogPost(item, now))
      .filter((item): item is NonNullable<typeof item> => !!item && item.published);

    return posts.find((post) => post.slug === slug) ?? null;
  },
});

export const listPages = query({
  handler: async (ctx) => {
    const now = Date.now();
    const data = await loadSettingsData(ctx);
    const sourcePages = toContentArray(data.content_pages);
    const records = sourcePages.length > 0 ? sourcePages : fallbackContentPages;
    return records
      .map((item) => normalizeContentPage(item, now))
      .filter((item): item is NonNullable<typeof item> => !!item && item.published)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((item) => ({
        slug: item.slug,
        title: item.title,
        updated_at: item.updated_at,
      }));
  },
});

export const getPageBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const slug = normalizeSlug(args.slug);
    if (!slug) return null;

    const data = await loadSettingsData(ctx);
    const sourcePages = toContentArray(data.content_pages);
    const records = sourcePages.length > 0 ? sourcePages : fallbackContentPages;
    const pages = records
      .map((item) => normalizeContentPage(item, now))
      .filter((item): item is NonNullable<typeof item> => !!item && item.published);

    return pages.find((page) => page.slug === slug) ?? null;
  },
});

export const listSeoPosts = query({
  handler: async (ctx) => {
    const now = Date.now();
    const data = await loadSettingsData(ctx);
    const sourcePosts = toContentArray(data.blog_posts);
    const records = sourcePosts.length > 0 ? sourcePosts : fallbackBlogPosts;
    return records
      .map((item) => normalizeBlogPost(item, now))
      .filter((item): item is NonNullable<typeof item> => !!item && item.published)
      .map((item) => ({
        slug: item.slug,
        updated_at: item.updated_at,
      }));
  },
});

export const listSeoPages = query({
  handler: async (ctx) => {
    const now = Date.now();
    const data = await loadSettingsData(ctx);
    const sourcePages = toContentArray(data.content_pages);
    const records = sourcePages.length > 0 ? sourcePages : fallbackContentPages;
    return records
      .map((item) => normalizeContentPage(item, now))
      .filter((item): item is NonNullable<typeof item> => !!item && item.published)
      .map((item) => ({
        slug: item.slug,
        updated_at: item.updated_at,
      }));
  },
});

export const seoHealthReport = query({
  handler: async (ctx) => {
    const now = Date.now();
    const data = await loadSettingsData(ctx);

    const dataIssues: DataIssue[] = [];
    const safeCollect = async (table: string) => {
      try {
        return await ctx.db.query(table as any).collect();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown table query error";
        dataIssues.push({ source: table, message });
        return [];
      }
    };

    const [categories, products, collections] = await Promise.all([
      safeCollect("categories"),
      safeCollect("products"),
      safeCollect("collections"),
    ]);

    const sourcePages = toContentArray(data.content_pages);
    const pages = (sourcePages.length > 0 ? sourcePages : fallbackContentPages)
      .map((row) => normalizeContentPage(row, now))
      .filter((row): row is NonNullable<typeof row> => !!row && row.published);

    const sourcePosts = toContentArray(data.blog_posts);
    const posts = (sourcePosts.length > 0 ? sourcePosts : fallbackBlogPosts)
      .map((row) => normalizeBlogPost(row, now))
      .filter((row): row is NonNullable<typeof row> => !!row && row.published);

    const knownPaths = new Set<string>([
      "/",
      "/blog",
      "/search",
      "/cart",
      "/wishlist",
      "/support",
      "/track-order",
      "/returns/new",
      "/checkout/information",
      "/checkout/shipping",
      "/checkout/payment",
      "/checkout/review",
    ]);

    for (const category of categories as Array<Record<string, unknown>>) {
      if (typeof category.slug === "string" && category.slug.trim()) {
        knownPaths.add(normalizePath(`/category/${category.slug}`));
      }
    }
    for (const product of products as Array<Record<string, unknown>>) {
      if (typeof product.slug === "string" && product.slug.trim()) {
        knownPaths.add(normalizePath(`/product/${product.slug}`));
      }
    }
    for (const collection of collections as Array<Record<string, unknown>>) {
      if (collection.published === true && typeof collection.slug === "string") {
        knownPaths.add(normalizePath(`/collections/${collection.slug}`));
      }
    }
    for (const page of pages) {
      knownPaths.add(normalizePath(`/pages/${page.slug}`));
    }
    for (const post of posts) {
      knownPaths.add(normalizePath(`/blog/${post.slug}`));
    }

    const footer = (data.footer_links ?? {}) as Record<string, unknown>;
    const footerSections = ["shop", "help", "company"];
    const brokenLinks: LinkIssue[] = [];
    let checkedLinks = 0;
    for (const section of footerSections) {
      const entries = Array.isArray(footer[section]) ? (footer[section] as unknown[]) : [];
      entries.forEach((entry, index) => {
        const href = toFooterLinkHref(entry);
        if (!href || !isInternalHref(href)) return;
        checkedLinks += 1;
        const normalized = normalizePath(href);
        if (!knownPaths.has(normalized)) {
          brokenLinks.push({
            source: `footer.${section}[${index}]`,
            href,
            normalized,
            reason: "No matching internal route or entity slug",
          });
        }
      });
    }

    const redirectRules = parseRedirectRules(data.redirect_rules);
    const redirectIssues: RedirectIssue[] = [];
    const fromCounts = new Map<string, number>();
    for (const rule of redirectRules) {
      fromCounts.set(rule.from, (fromCounts.get(rule.from) ?? 0) + 1);
      if (![301, 302, 307, 308].includes(rule.status)) {
        redirectIssues.push({
          type: "invalid_status",
          message: "Redirect has unsupported status code",
          from: rule.from,
          to: rule.to,
          status: rule.status,
        });
      }
      if (normalizePath(rule.from) === normalizePath(rule.to)) {
        redirectIssues.push({
          type: "self_redirect",
          message: "Redirect points to itself",
          from: rule.from,
          to: rule.to,
          status: rule.status,
        });
      }
      if (isInternalHref(rule.to)) {
        const normalizedTo = normalizePath(rule.to);
        if (!knownPaths.has(normalizedTo)) {
          redirectIssues.push({
            type: "broken_target",
            message: "Redirect target does not resolve to a known path",
            from: rule.from,
            to: rule.to,
            status: rule.status,
          });
        }
      }
    }
    for (const [from, count] of fromCounts.entries()) {
      if (count > 1) {
        redirectIssues.push({
          type: "duplicate_from",
          message: "Multiple redirects share the same source path",
          from,
        });
      }
    }

    return {
      generated_at: now,
      summary: {
        known_path_count: knownPaths.size,
        checked_link_count: checkedLinks,
        broken_link_count: brokenLinks.length,
        redirect_count: redirectRules.length,
        redirect_issue_count: redirectIssues.length,
        data_issue_count: dataIssues.length,
      },
      broken_links: brokenLinks.slice(0, 50),
      redirect_issues: redirectIssues.slice(0, 50),
      data_issues: dataIssues.slice(0, 20),
    };
  },
});
