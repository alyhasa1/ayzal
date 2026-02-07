import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { slugify } from "./lib/slugify";
import { attachRelations } from "./products";

type CollectionRules = {
  category_slugs?: string[];
  tags?: string[];
  in_stock_only?: boolean;
  new_arrivals_only?: boolean;
  min_price?: number;
  max_price?: number;
  limit?: number;
};

type SortMode =
  | "manual"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "spotlight"
  | "name-asc"
  | "name-desc";

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

function normalizeSort(sort?: string): SortMode {
  const value = (sort ?? "manual").trim().toLowerCase();
  switch (value) {
    case "newest":
    case "price-asc":
    case "price-desc":
    case "spotlight":
    case "name-asc":
    case "name-desc":
      return value;
    default:
      return "manual";
  }
}

function toRules(rules: unknown): CollectionRules {
  if (!rules || typeof rules !== "object") return {};
  const source = rules as Record<string, unknown>;
  const categorySlugs = Array.isArray(source.category_slugs)
    ? source.category_slugs.filter((value): value is string => typeof value === "string")
    : undefined;
  const tags = Array.isArray(source.tags)
    ? source.tags.filter((value): value is string => typeof value === "string")
    : undefined;
  return {
    category_slugs: categorySlugs?.map((value) => value.trim().toLowerCase()).filter(Boolean),
    tags: tags?.map(normalizeTag).filter(Boolean),
    in_stock_only: source.in_stock_only === true,
    new_arrivals_only: source.new_arrivals_only === true,
    min_price: typeof source.min_price === "number" ? source.min_price : undefined,
    max_price: typeof source.max_price === "number" ? source.max_price : undefined,
    limit: typeof source.limit === "number" ? source.limit : undefined,
  };
}

async function ensureUniqueSlug(
  ctx: { db: any },
  name: string,
  excludeId?: Id<"collections">
) {
  const base = slugify(name) || "collection";
  let candidate = base;
  let counter = 2;

  // Keep collection slugs stable and unique for SEO-safe URLs.
  while (true) {
    const existing = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q: any) => q.eq("slug", candidate))
      .unique();
    if (!existing || existing._id === excludeId) {
      return candidate;
    }
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}

function sortProducts(
  products: Doc<"products">[],
  sortMode: SortMode,
  manualOrder: Map<string, number>
) {
  const sorted = [...products];
  switch (sortMode) {
    case "newest":
      sorted.sort((a, b) => b.created_at - a.created_at);
      break;
    case "price-asc":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "spotlight":
      sorted.sort((a, b) => {
        const aRank = typeof a.spotlight_rank === "number" ? a.spotlight_rank : Number.MAX_SAFE_INTEGER;
        const bRank = typeof b.spotlight_rank === "number" ? b.spotlight_rank : Number.MAX_SAFE_INTEGER;
        if (aRank !== bRank) return aRank - bRank;
        return b.created_at - a.created_at;
      });
      break;
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "manual":
    default:
      sorted.sort((a, b) => {
        const aOrder = manualOrder.get(String(a._id)) ?? Number.MAX_SAFE_INTEGER;
        const bOrder = manualOrder.get(String(b._id)) ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return b.created_at - a.created_at;
      });
      break;
  }
  return sorted;
}

async function collectCollectionProducts(ctx: { db: any }, collection: Doc<"collections">) {
  const links = await ctx.db
    .query("product_collections")
    .withIndex("by_collection", (q: any) => q.eq("collection_id", collection._id))
    .collect();

  const manualOrder = new Map<string, number>();
  const candidateIds = new Set<Id<"products">>();
  for (const link of links) {
    manualOrder.set(String(link.product_id), link.sort_order ?? Number.MAX_SAFE_INTEGER);
    candidateIds.add(link.product_id);
  }

  const rules = toRules(collection.rules);
  if (rules.category_slugs && rules.category_slugs.length > 0) {
    for (const slug of rules.category_slugs) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q: any) => q.eq("slug", slug))
        .unique();
      if (!category) continue;
      const rows = await ctx.db
        .query("products")
        .withIndex("by_category", (q: any) => q.eq("category_id", category._id))
        .collect();
      rows.forEach((product) => candidateIds.add(product._id));
    }
  }

  if (rules.tags && rules.tags.length > 0) {
    for (const tag of rules.tags) {
      const rows = await ctx.db
        .query("product_tags")
        .withIndex("by_tag", (q: any) => q.eq("normalized_tag", tag))
        .collect();
      rows.forEach((row) => candidateIds.add(row.product_id));
    }
  }

  let candidateProducts: Doc<"products">[] = [];
  if (candidateIds.size === 0) {
    candidateProducts = await ctx.db.query("products").collect();
  } else {
    for (const productId of candidateIds) {
      const product = await ctx.db.get(productId);
      if (product) {
        candidateProducts.push(product);
      }
    }
  }

  const filtered = candidateProducts.filter((product) => {
    if (rules.in_stock_only && product.in_stock === false) return false;
    if (rules.new_arrivals_only && product.is_new_arrival !== true) return false;
    if (typeof rules.min_price === "number" && product.price < rules.min_price) return false;
    if (typeof rules.max_price === "number" && product.price > rules.max_price) return false;
    return true;
  });

  return { links, manualOrder, products: filtered, rules };
}

export const listPublic = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("collections")
      .withIndex("by_sort")
      .collect()
      .then((rows: Doc<"collections">[]) => rows.filter((row) => row.published));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
    if (!collection || !collection.published) {
      return null;
    }
    return collection;
  },
});

export const getPublicWithProducts = query({
  args: {
    slug: v.string(),
    sort: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const collection = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .unique();
    if (!collection || !collection.published) {
      return null;
    }

    const { manualOrder, products, rules } = await collectCollectionProducts(ctx, collection);
    const sorted = sortProducts(products, normalizeSort(args.sort), manualOrder);
    const ruleLimit = typeof rules.limit === "number" ? Math.max(1, rules.limit) : undefined;
    const explicitLimit = args.limit ? Math.max(1, args.limit) : undefined;
    const appliedLimit = explicitLimit ?? ruleLimit;
    const limited = appliedLimit ? sorted.slice(0, appliedLimit) : sorted;

    const hydrated = [];
    for (const product of limited) {
      hydrated.push(await attachRelations(ctx, product));
    }

    return {
      collection,
      products: hydrated,
      total: sorted.length,
      sort: normalizeSort(args.sort),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    image_url: v.optional(v.string()),
    sort_order: v.optional(v.number()),
    published: v.optional(v.boolean()),
    rules: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const slug = await ensureUniqueSlug(ctx, args.name);
    return await ctx.db.insert("collections", {
      name: args.name,
      slug,
      description: args.description,
      image_url: args.image_url,
      sort_order: args.sort_order ?? now,
      rules: args.rules,
      published: args.published ?? true,
      created_at: now,
      updated_at: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("collections"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    image_url: v.optional(v.string()),
    sort_order: v.optional(v.number()),
    published: v.optional(v.boolean()),
    rules: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const current = await ctx.db.get(args.id);
    if (!current) {
      throw new Error("Collection not found");
    }

    const patch: Record<string, unknown> = {
      updated_at: Date.now(),
    };
    if (args.name !== undefined) {
      patch.name = args.name;
      patch.slug = await ensureUniqueSlug(ctx, args.name, args.id);
    }
    if (args.description !== undefined) patch.description = args.description;
    if (args.image_url !== undefined) patch.image_url = args.image_url;
    if (args.sort_order !== undefined) patch.sort_order = args.sort_order;
    if (args.published !== undefined) patch.published = args.published;
    if (args.rules !== undefined) patch.rules = args.rules;
    await ctx.db.patch(args.id, patch);
  },
});

export const remove = mutation({
  args: {
    id: v.id("collections"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const links = await ctx.db
      .query("product_collections")
      .withIndex("by_collection", (q: any) => q.eq("collection_id", args.id))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const addProduct = mutation({
  args: {
    collection_id: v.id("collections"),
    product_id: v.id("products"),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("product_collections")
      .withIndex("by_collection", (q: any) => q.eq("collection_id", args.collection_id))
      .collect();
    const duplicate = existing.find((link) => link.product_id === args.product_id);
    if (duplicate) {
      await ctx.db.patch(duplicate._id, { sort_order: args.sort_order });
      return duplicate._id;
    }
    return await ctx.db.insert("product_collections", {
      collection_id: args.collection_id,
      product_id: args.product_id,
      sort_order: args.sort_order,
    });
  },
});

export const removeProduct = mutation({
  args: {
    collection_id: v.id("collections"),
    product_id: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const links = await ctx.db
      .query("product_collections")
      .withIndex("by_collection", (q: any) => q.eq("collection_id", args.collection_id))
      .collect();
    const target = links.find((link) => link.product_id === args.product_id);
    if (target) {
      await ctx.db.delete(target._id);
    }
  },
});
