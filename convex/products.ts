import { mutation, query, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { slugify } from "./lib/slugify";

const productFields = {
  name: v.string(),
  price: v.number(),
  primary_image_url: v.string(),
  image_urls: v.optional(v.array(v.string())),
  category_id: v.id("categories"),
  description: v.optional(v.string()),
  fabric: v.optional(v.string()),
  work: v.optional(v.string()),
  includes: v.optional(v.array(v.string())),
  dimensions: v.optional(
    v.object({
      kameez: v.string(),
      dupatta: v.string(),
      shalwar: v.string(),
    })
  ),
  care: v.optional(v.array(v.string())),
  sizes: v.optional(v.array(v.string())),
  sku: v.optional(v.string()),
  in_stock: v.optional(v.boolean()),
  stock_quantity: v.optional(v.number()),
  is_new_arrival: v.optional(v.boolean()),
  spotlight_rank: v.optional(v.number()),
  meta_title: v.optional(v.string()),
  meta_description: v.optional(v.string()),
};

function normalizeTag(value: string) {
  return value.trim().toLowerCase();
}

function normalizeStockQuantity(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.floor(value));
}

async function generateUniqueSlug(ctx: any, baseSlug: string, excludeId?: string) {
  const normalizedBase = baseSlug || "product";
  let slug = normalizedBase;
  let existing = await ctx.db
    .query("products")
    .withIndex("by_slug", (q: any) => q.eq("slug", slug))
    .unique();

  if (!existing || (excludeId && existing._id === excludeId)) {
    return slug;
  }

  for (let i = 0; i < 5; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    slug = `${normalizedBase}-${suffix}`;
    existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q: any) => q.eq("slug", slug))
      .unique();
    if (!existing || (excludeId && existing._id === excludeId)) {
      return slug;
    }
  }

  return `${normalizedBase}-${Date.now().toString(36)}`;
}

export async function attachRelations(ctx: any, product: any) {
  const category = await ctx.db.get(product.category_id);
  const links = await ctx.db
    .query("product_payment_methods")
    .withIndex("by_product", (q: any) => q.eq("product_id", product._id))
    .collect();
  const tagRows = await ctx.db
    .query("product_tags")
    .withIndex("by_product", (q: any) => q.eq("product_id", product._id))
    .collect();
  const paymentMethods = await ctx.db.query("payment_methods").collect();
  const methodById = new Map(paymentMethods.map((m: any) => [m._id, m]));
  const methods = links
    .map((link: any) => methodById.get(link.payment_method_id))
    .filter(Boolean);
  const tags = Array.from(
    new Set(
      tagRows
        .map((row: any) => normalizeTag(row.tag ?? row.normalized_tag ?? ""))
        .filter(Boolean)
    )
  );
  return {
    ...product,
    category_name: category?.name ?? "",
    category_slug: category?.slug ?? "",
    payment_methods: methods,
    tags,
  };
}

async function attachMany(ctx: any, products: any[]) {
  const results = [];
  for (const product of products) {
    results.push(await attachRelations(ctx, product));
  }
  return results;
}

async function hydrateProductsByScore(
  ctx: any,
  scored: Array<{ product_id: any; score: number }>,
  excludeProductId: string,
  limit: number
) {
  const rows = [...scored]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(limit * 3, limit));
  const products: any[] = [];
  for (const row of rows) {
    if (String(row.product_id) === excludeProductId) continue;
    const product = await ctx.db.get(row.product_id);
    if (!product) continue;
    products.push(product);
    if (products.length >= limit) break;
  }
  return await attachMany(ctx, products);
}

export const list = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return await attachMany(ctx, products);
  },
});

export const listNewArrivals = query({
  handler: async (ctx) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_new_arrival", (q) => q.eq("is_new_arrival", true))
      .collect();
    return await attachMany(ctx, products);
  },
});

export const listRelated = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return [];
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", product.category_id))
      .collect();
    const filtered = products.filter((p) => p._id !== args.productId).slice(0, 4);
    return await attachMany(ctx, filtered);
  },
});

export const recommendationBundle = query({
  args: {
    product_id: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);
    const product = await ctx.db.get(args.product_id);
    if (!product) {
      return {
        frequently_bought_together: [],
        complete_the_look: [],
        tag_matches: [],
      };
    }

    const currentProductId = String(args.product_id);
    const orderItems = await ctx.db.query("order_items").collect();
    const orderIdsWithCurrent = new Set<string>(
      orderItems
        .filter((item) => String(item.product_id) === currentProductId)
        .map((item) => String(item.order_id))
    );
    const boughtTogetherCounts = new Map<string, { product_id: any; score: number }>();
    if (orderIdsWithCurrent.size > 0) {
      for (const item of orderItems) {
        if (!orderIdsWithCurrent.has(String(item.order_id))) continue;
        const itemProductId = String(item.product_id);
        if (itemProductId === currentProductId) continue;
        const existing = boughtTogetherCounts.get(itemProductId) ?? {
          product_id: item.product_id,
          score: 0,
        };
        existing.score += item.quantity;
        boughtTogetherCounts.set(itemProductId, existing);
      }
    }

    const tagRows = await ctx.db
      .query("product_tags")
      .withIndex("by_product", (q) => q.eq("product_id", args.product_id))
      .collect();
    const tagScores = new Map<string, { product_id: any; score: number }>();
    for (const tagRow of tagRows) {
      const related = await ctx.db
        .query("product_tags")
        .withIndex("by_tag", (q) => q.eq("normalized_tag", tagRow.normalized_tag))
        .collect();
      for (const relatedRow of related) {
        const relatedProductId = String(relatedRow.product_id);
        if (relatedProductId === currentProductId) continue;
        const existing = tagScores.get(relatedProductId) ?? {
          product_id: relatedRow.product_id,
          score: 0,
        };
        existing.score += 1;
        tagScores.set(relatedProductId, existing);
      }
    }

    const sameCategory = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", product.category_id))
      .collect();
    const completeLook = sameCategory
      .filter((row) => String(row._id) !== currentProductId)
      .sort((a, b) => {
        const aNew = a.is_new_arrival ? 1 : 0;
        const bNew = b.is_new_arrival ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
        return b.updated_at - a.updated_at;
      })
      .slice(0, limit);

    return {
      frequently_bought_together: await hydrateProductsByScore(
        ctx,
        Array.from(boughtTogetherCounts.values()),
        currentProductId,
        limit
      ),
      complete_the_look: await attachMany(ctx, completeLook),
      tag_matches: await hydrateProductsByScore(
        ctx,
        Array.from(tagScores.values()),
        currentProductId,
        limit
      ),
    };
  },
});

export const listByCategorySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!category) return [];
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category_id", category._id))
      .collect();
    return await attachMany(ctx, products);
  },
});

type SearchSortMode =
  | "relevance"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "best-selling"
  | "top-rated";

const SEARCH_SYNONYMS: Record<string, string[]> = {
  suit: ["dress", "outfit"],
  dresses: ["suits", "outfits"],
  lawn: ["summer", "cotton"],
  unstitched: ["unstitch", "fabric"],
  formal: ["party", "wedding"],
  bridal: ["wedding", "formal"],
  eid: ["festive", "occasion"],
  casual: ["daily", "everyday"],
};

function normalizeSearchSort(sort?: string): SearchSortMode {
  const value = (sort ?? "relevance").trim().toLowerCase();
  switch (value) {
    case "newest":
    case "price-asc":
    case "price-desc":
    case "best-selling":
    case "top-rated":
      return value;
    default:
      return "relevance";
  }
}

function tokenizeQuery(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function expandSearchTerms(terms: string[]) {
  const expanded = new Set<string>(terms);
  for (const term of terms) {
    for (const synonym of SEARCH_SYNONYMS[term] ?? []) {
      expanded.add(synonym);
    }
  }
  return Array.from(expanded);
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

export const search = query({
  args: {
    query: v.optional(v.string()),
    category_slug: v.optional(v.string()),
    in_stock_only: v.optional(v.boolean()),
    min_price: v.optional(v.number()),
    max_price: v.optional(v.number()),
    sort: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalizedQuery = (args.query ?? "").trim().toLowerCase();
    const terms = tokenizeQuery(normalizedQuery);
    const expandedTerms = expandSearchTerms(terms);
    const sortMode = normalizeSearchSort(args.sort);
    const limit = Math.min(Math.max(args.limit ?? 40, 1), 120);

    let products = await ctx.db.query("products").collect();

    if (args.category_slug) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.category_slug as string))
        .unique();
      if (!category) {
        return {
          products: [],
          total: 0,
          sort: sortMode,
          query: args.query ?? "",
          facets: {
            in_stock: 0,
            out_of_stock: 0,
            min_price: 0,
            max_price: 0,
          },
        };
      }
      products = products.filter((product) => product.category_id === category._id);
    }

    if (args.in_stock_only) {
      products = products.filter((product) => product.in_stock !== false);
    }
    if (typeof args.min_price === "number") {
      products = products.filter((product) => product.price >= args.min_price!);
    }
    if (typeof args.max_price === "number") {
      products = products.filter((product) => product.price <= args.max_price!);
    }

    const tags = await ctx.db.query("product_tags").collect();
    const tagsByProduct = new Map<string, string[]>();
    for (const tagRow of tags) {
      const id = String(tagRow.product_id);
      const current = tagsByProduct.get(id) ?? [];
      current.push(tagRow.normalized_tag);
      tagsByProduct.set(id, current);
    }

    const categories = await ctx.db.query("categories").collect();
    const categoryNameById = new Map(
      categories.map((category) => [String(category._id), category.name.toLowerCase()])
    );

    const scoreProducts = (activeTerms: string[], phrase: string) =>
      products
        .map((product) => {
        const name = product.name.toLowerCase();
        const description = (product.description ?? "").toLowerCase();
        const fabric = (product.fabric ?? "").toLowerCase();
        const work = (product.work ?? "").toLowerCase();
        const sku = (product.sku ?? "").toLowerCase();
        const categoryName = categoryNameById.get(String(product.category_id)) ?? "";
        const productTags = tagsByProduct.get(String(product._id)) ?? [];

        let score = 0;
        if (phrase && name.includes(phrase)) {
          score += 12;
        }

        for (const term of activeTerms) {
          if (name.startsWith(term)) score += 8;
          else if (name.includes(term)) score += 5;

          if (description.includes(term)) score += 2;
          if (fabric.includes(term)) score += 2;
          if (work.includes(term)) score += 2;
          if (sku.includes(term)) score += 3;
          if (categoryName.includes(term)) score += 1;
          if (productTags.some((tag) => tag.includes(term))) score += 3;
        }

        if (product.in_stock !== false) score += 0.3;
        if (product.is_new_arrival) score += 0.3;

        return { product, score };
      })
      .filter((row) => (activeTerms.length > 0 ? row.score > 0 : true));

    let correctedQuery: string | null = null;
    let scored = scoreProducts(expandedTerms, normalizedQuery);
    if (terms.length > 0 && scored.length === 0) {
      const candidateTokens = new Set<string>();
      for (const product of products) {
        for (const token of tokenizeQuery(product.name)) candidateTokens.add(token);
        for (const token of tokenizeQuery(product.fabric ?? "")) candidateTokens.add(token);
        for (const token of tokenizeQuery(product.work ?? "")) candidateTokens.add(token);
        for (const token of tokenizeQuery(product.sku ?? "")) candidateTokens.add(token);
        for (const token of tagsByProduct.get(String(product._id)) ?? []) candidateTokens.add(token);
      }
      for (const category of categories) {
        for (const token of tokenizeQuery(category.name)) candidateTokens.add(token);
      }
      const tokenPool = Array.from(candidateTokens).slice(0, 350);
      const correctedTerms = terms.map((term) => {
        let best = term;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const candidate of tokenPool) {
          const distance = levenshteinDistance(term, candidate);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
          }
          if (bestDistance === 0) break;
        }
        return bestDistance <= 2 ? best : term;
      });
      const corrected = correctedTerms.join(" ");
      if (corrected !== normalizedQuery) {
        correctedQuery = corrected;
        scored = scoreProducts(expandSearchTerms(correctedTerms), corrected);
      }
    }

    const soldByProduct = new Map<string, number>();
    const ratingByProduct = new Map<string, { avg: number; count: number }>();
    if (sortMode === "best-selling") {
      const orderItems = await ctx.db.query("order_items").collect();
      for (const item of orderItems) {
        const id = String(item.product_id);
        soldByProduct.set(id, (soldByProduct.get(id) ?? 0) + item.quantity);
      }
    }
    if (sortMode === "top-rated") {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect();
      const totals = new Map<string, { total: number; count: number }>();
      for (const review of reviews) {
        const id = String(review.product_id);
        const current = totals.get(id) ?? { total: 0, count: 0 };
        current.total += review.rating;
        current.count += 1;
        totals.set(id, current);
      }
      for (const [id, value] of totals.entries()) {
        ratingByProduct.set(id, { avg: value.total / value.count, count: value.count });
      }
    }

    scored.sort((a, b) => {
      switch (sortMode) {
        case "newest":
          return b.product.created_at - a.product.created_at;
        case "price-asc":
          return a.product.price - b.product.price;
        case "price-desc":
          return b.product.price - a.product.price;
        case "best-selling": {
          const aSold = soldByProduct.get(String(a.product._id)) ?? 0;
          const bSold = soldByProduct.get(String(b.product._id)) ?? 0;
          if (aSold !== bSold) return bSold - aSold;
          return b.product.created_at - a.product.created_at;
        }
        case "top-rated": {
          const aRating = ratingByProduct.get(String(a.product._id)) ?? { avg: 0, count: 0 };
          const bRating = ratingByProduct.get(String(b.product._id)) ?? { avg: 0, count: 0 };
          if (aRating.avg !== bRating.avg) return bRating.avg - aRating.avg;
          if (aRating.count !== bRating.count) return bRating.count - aRating.count;
          return b.product.created_at - a.product.created_at;
        }
        case "relevance":
        default:
          if (a.score !== b.score) return b.score - a.score;
          return b.product.updated_at - a.product.updated_at;
      }
    });

    const total = scored.length;
    const shortlisted = scored.slice(0, limit).map((row) => row.product);
    const hydrated = await attachMany(ctx, shortlisted);
    const prices = scored.map((row) => row.product.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const inStock = scored.filter((row) => row.product.in_stock !== false).length;

    return {
      products: hydrated,
      total,
      sort: sortMode,
      query: args.query ?? "",
      corrected_query: correctedQuery ?? undefined,
      facets: {
        in_stock: inStock,
        out_of_stock: total - inStock,
        min_price: minPrice,
        max_price: maxPrice,
      },
    };
  },
});

export const searchSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const normalized = args.query.trim().toLowerCase();
    const limit = Math.min(Math.max(args.limit ?? 6, 1), 12);
    if (!normalized) {
      return {
        query: "",
        corrected_query: undefined,
        products: [],
        categories: [],
        tags: [],
        hints: ["lawn suits", "eid edits", "new arrivals", "ready to ship"],
      };
    }

    const terms = tokenizeQuery(normalized);
    const expandedTerms = expandSearchTerms(terms);
    const [products, categories, tagRows] = await Promise.all([
      ctx.db.query("products").collect(),
      ctx.db.query("categories").collect(),
      ctx.db.query("product_tags").collect(),
    ]);

    const categoryById = new Map(categories.map((category) => [String(category._id), category]));
    const tagsByProduct = new Map<string, string[]>();
    const tagFrequency = new Map<string, number>();
    for (const tagRow of tagRows) {
      const id = String(tagRow.product_id);
      const current = tagsByProduct.get(id) ?? [];
      current.push(tagRow.normalized_tag);
      tagsByProduct.set(id, current);
      tagFrequency.set(tagRow.normalized_tag, (tagFrequency.get(tagRow.normalized_tag) ?? 0) + 1);
    }

    const scoreProducts = (activeTerms: string[], phrase: string) =>
      products
        .map((product) => {
          const name = product.name.toLowerCase();
          const categoryName = categoryById.get(String(product.category_id))?.name.toLowerCase() ?? "";
          const fabric = (product.fabric ?? "").toLowerCase();
          const sku = (product.sku ?? "").toLowerCase();
          const productTags = tagsByProduct.get(String(product._id)) ?? [];
          let score = 0;

          if (name.includes(phrase)) score += 8;
          for (const term of activeTerms) {
            if (name.startsWith(term)) score += 6;
            else if (name.includes(term)) score += 4;
            if (categoryName.includes(term)) score += 2;
            if (fabric.includes(term)) score += 1.5;
            if (sku.includes(term)) score += 2;
            if (productTags.some((tag) => tag.includes(term))) score += 2;
          }
          if (product.in_stock !== false) score += 0.4;
          if (product.is_new_arrival) score += 0.4;
          return { product, score };
        })
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score);

    let correctedQuery: string | undefined;
    let scored = scoreProducts(expandedTerms, normalized);
    if (scored.length === 0 && terms.length > 0) {
      const tokenPool = new Set<string>();
      for (const product of products) {
        tokenizeQuery(product.name).forEach((token) => tokenPool.add(token));
      }
      for (const category of categories) {
        tokenizeQuery(category.name).forEach((token) => tokenPool.add(token));
      }
      for (const tag of tagFrequency.keys()) tokenPool.add(tag);

      const pool = Array.from(tokenPool).slice(0, 300);
      const correctedTerms = terms.map((term) => {
        let best = term;
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const candidate of pool) {
          const distance = levenshteinDistance(term, candidate);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = candidate;
          }
          if (bestDistance === 0) break;
        }
        return bestDistance <= 2 ? best : term;
      });
      const candidateQuery = correctedTerms.join(" ");
      if (candidateQuery !== normalized) {
        correctedQuery = candidateQuery;
        scored = scoreProducts(expandSearchTerms(correctedTerms), candidateQuery);
      }
    }

    const topProducts = scored.slice(0, limit);
    const productSuggestions = [];
    for (const row of topProducts) {
      const category = categoryById.get(String(row.product.category_id));
      productSuggestions.push({
        id: row.product._id,
        slug: row.product.slug,
        name: row.product.name,
        image: row.product.primary_image_url,
        price: row.product.price,
        category: category?.name ?? "",
        in_stock: row.product.in_stock !== false,
      });
    }

    const categorySuggestions = categories
      .map((category) => {
        const score = expandedTerms.reduce((sum, term) => {
          const name = category.name.toLowerCase();
          if (name.startsWith(term)) return sum + 4;
          if (name.includes(term)) return sum + 2;
          return sum;
        }, 0);
        return { category, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((row) => ({
        id: row.category._id,
        slug: row.category.slug,
        name: row.category.name,
      }));

    const tagSuggestions = Array.from(tagFrequency.entries())
      .filter(([tag]) => expandedTerms.some((term) => tag.includes(term)))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);

    const hints = Array.from(new Set([...expandedTerms, ...tagSuggestions])).slice(0, 8);

    return {
      query: normalized,
      corrected_query: correctedQuery,
      products: productSuggestions,
      categories: categorySuggestions,
      tags: tagSuggestions,
      hints,
    };
  },
});

export const discoveryModules = query({
  args: {
    limit: v.optional(v.number()),
    current_product_id: v.optional(v.id("products")),
    category_slug: v.optional(v.string()),
    under_price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);
    const excludedId = args.current_product_id ? String(args.current_product_id) : "";
    let products = await ctx.db.query("products").collect();

    if (args.category_slug) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.category_slug as string))
        .unique();
      if (category) {
        products = products.filter((product) => String(product.category_id) === String(category._id));
      }
    }

    const orderItems = await ctx.db.query("order_items").collect();
    const soldByProduct = new Map<string, { product_id: any; score: number }>();
    for (const item of orderItems) {
      const key = String(item.product_id);
      const existing = soldByProduct.get(key) ?? { product_id: item.product_id, score: 0 };
      existing.score += item.quantity;
      soldByProduct.set(key, existing);
    }

    const publishedReviews = await ctx.db
      .query("reviews")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();
    const ratingByProduct = new Map<string, { product_id: any; score: number }>();
    for (const review of publishedReviews) {
      const key = String(review.product_id);
      const existing = ratingByProduct.get(key) ?? { product_id: review.product_id, score: 0 };
      existing.score += review.rating;
      ratingByProduct.set(key, existing);
    }

    const underPrice = Math.max(1000, args.under_price ?? 7999);
    const justDropped = await attachMany(
      ctx,
      [...products]
        .filter((product) => String(product._id) !== excludedId)
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit)
    );
    const budgetPicks = await attachMany(
      ctx,
      [...products]
        .filter(
          (product) =>
            String(product._id) !== excludedId &&
            product.in_stock !== false &&
            product.price <= underPrice
        )
        .sort((a, b) => b.updated_at - a.updated_at)
        .slice(0, limit)
    );
    const inStockNow = await attachMany(
      ctx,
      [...products]
        .filter((product) => String(product._id) !== excludedId && product.in_stock !== false)
        .sort((a, b) => {
          const aNew = a.is_new_arrival ? 1 : 0;
          const bNew = b.is_new_arrival ? 1 : 0;
          if (aNew !== bNew) return bNew - aNew;
          return b.updated_at - a.updated_at;
        })
        .slice(0, limit)
    );

    return {
      trending_now: await hydrateProductsByScore(
        ctx,
        Array.from(soldByProduct.values()),
        excludedId,
        limit
      ),
      top_rated: await hydrateProductsByScore(
        ctx,
        Array.from(ratingByProduct.values()),
        excludedId,
        limit
      ),
      just_dropped: justDropped,
      budget_picks: budgetPicks,
      in_stock_now: inStockNow,
    };
  },
});

export const listSeo = query({
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products
      .filter((product) => !!product.slug)
      .map((product) => ({
        slug: product.slug,
        updated_at: product.updated_at,
        name: product.name,
        primary_image_url: product.primary_image_url,
      }));
  },
});

export const getSpotlight = query({
  handler: async (ctx) => {
    const spotlightItems = await ctx.db
      .query("products")
      .withIndex("by_spotlight")
      .collect();
    if (spotlightItems.length > 0) {
      const sorted = spotlightItems
        .filter((item: any) => item.spotlight_rank !== undefined && item.spotlight_rank !== null)
        .sort((a: any, b: any) => (a.spotlight_rank ?? 0) - (b.spotlight_rank ?? 0));
      if (sorted.length > 0) {
        return await attachRelations(ctx, sorted[0]);
      }
    }
    const fallback = await ctx.db.query("products").collect();
    if (fallback.length === 0) return null;
    return await attachRelations(ctx, fallback[0]);
  },
});

export const getById = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) return null;
    return await attachRelations(ctx, product);
  },
});

export const getBySlugOrId = query({
  args: { slugOrId: v.string() },
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("products", args.slugOrId);
    if (normalizedId) {
      const byId = await ctx.db.get(normalizedId);
      if (!byId) return null;
      return {
        product: await attachRelations(ctx, byId),
        matchedBy: "id" as const,
      };
    }

    const bySlug = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slugOrId))
      .unique();
    if (!bySlug) return null;
    return {
      product: await attachRelations(ctx, bySlug),
      matchedBy: "slug" as const,
    };
  },
});

export const create = mutation({
  args: {
    ...productFields,
    payment_method_ids: v.optional(v.array(v.id("payment_methods"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const slug = await generateUniqueSlug(ctx, slugify(args.name));
    const normalizedStockQuantity = normalizeStockQuantity(args.stock_quantity);
    const stockQuantity =
      normalizedStockQuantity ?? (args.in_stock === false ? 0 : 1);
    const inStock = stockQuantity > 0;

    const productId = await ctx.db.insert("products", {
      name: args.name,
      slug,
      price: args.price,
      primary_image_url: args.primary_image_url,
      image_urls: args.image_urls,
      category_id: args.category_id,
      description: args.description,
      fabric: args.fabric,
      work: args.work,
      includes: args.includes,
      dimensions: args.dimensions,
      care: args.care,
      sizes: args.sizes,
      sku: args.sku,
      in_stock: inStock,
      stock_quantity: stockQuantity,
      is_new_arrival: args.is_new_arrival ?? false,
      spotlight_rank: args.spotlight_rank,
      created_at: now,
      updated_at: now,
    });
    const paymentIds = args.payment_method_ids ?? [];
    for (const paymentId of paymentIds) {
      await ctx.db.insert("product_payment_methods", {
        product_id: productId,
        payment_method_id: paymentId,
      });
    }
    await ctx.scheduler.runAfter(0, internal.products.pingSitemap, {});
    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    ...Object.fromEntries(
      Object.entries(productFields).map(([key, value]) => [key, v.optional(value as any)])
    ) as any,
    payment_method_ids: v.optional(v.array(v.id("payment_methods"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const before = await ctx.db.get(args.id);
    if (!before) {
      throw new Error("Product not found");
    }

    const update: any = { updated_at: Date.now() };
    for (const key of Object.keys(productFields)) {
      const value = (args as any)[key];
      if (value !== undefined) {
        update[key] = value;
      }
    }

    const normalizedStockQuantity = normalizeStockQuantity(args.stock_quantity);
    if (normalizedStockQuantity !== undefined) {
      update.stock_quantity = normalizedStockQuantity;
      update.in_stock = normalizedStockQuantity > 0;
    } else if (args.in_stock !== undefined) {
      const existingQuantity =
        normalizeStockQuantity((before as any).stock_quantity) ??
        ((before as any).in_stock === false ? 0 : 1);
      update.in_stock = args.in_stock;
      if (!args.in_stock) {
        update.stock_quantity = 0;
      } else if (existingQuantity <= 0) {
        update.stock_quantity = 1;
      }
    }

    if (args.name !== undefined) {
      update.slug = await generateUniqueSlug(ctx, slugify(args.name), args.id);
    }
    await ctx.db.patch(args.id, update);
    if (args.payment_method_ids) {
      const existing = await ctx.db
        .query("product_payment_methods")
        .withIndex("by_product", (q) => q.eq("product_id", args.id))
        .collect();
      for (const link of existing) {
        await ctx.db.delete(link._id);
      }
      for (const paymentId of args.payment_method_ids) {
        await ctx.db.insert("product_payment_methods", {
          product_id: args.id,
          payment_method_id: paymentId,
        });
      }
    }
    await ctx.scheduler.runAfter(0, internal.products.pingSitemap, {});
  },
});

export const setTags = mutation({
  args: {
    id: v.id("products"),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("product_tags")
      .withIndex("by_product", (q) => q.eq("product_id", args.id))
      .collect();
    for (const row of existing) {
      await ctx.db.delete(row._id);
    }

    const uniqueTags = Array.from(
      new Set(args.tags.map((value) => normalizeTag(value)).filter(Boolean))
    ).slice(0, 40);
    const now = Date.now();
    for (const tag of uniqueTags) {
      await ctx.db.insert("product_tags", {
        product_id: args.id,
        tag,
        normalized_tag: tag,
        created_at: now,
      });
    }
    await ctx.db.patch(args.id, { updated_at: now });
    return { product_id: args.id, count: uniqueTags.length };
  },
});

export const backfillSlugs = mutation({
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").collect();
    let updated = 0;
    for (const product of products) {
      if (product.slug) continue;
      const slug = await generateUniqueSlug(ctx, slugify(product.name), product._id);
      await ctx.db.patch(product._id, {
        slug,
        updated_at: Date.now(),
      });
      updated += 1;
    }
    return { updated };
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const links = await ctx.db
      .query("product_payment_methods")
      .withIndex("by_product", (q) => q.eq("product_id", args.id))
      .collect();
    for (const link of links) {
      await ctx.db.delete(link._id);
    }
    await ctx.db.delete(args.id);
    await ctx.scheduler.runAfter(0, internal.products.pingSitemap, {});
  },
});

export const pingSitemap = internalAction({
  args: {},
  handler: async () => {
    try {
      await fetch(
        "https://www.google.com/ping?sitemap=https://ayzalcollections.com/sitemap.xml"
      );
    } catch {
      // best-effort ping — do not block on failure
    }
  },
});
