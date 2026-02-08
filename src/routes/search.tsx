import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/cloudflare";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import { mapProduct } from "@/lib/mappers";
import { formatPrice } from "@/lib/format";
import DiscoveryRail from "@/components/shop/DiscoveryRail";
import ProductGridCard from "@/components/shop/ProductGridCard";

const CANONICAL_BASE = "https://ayzalcollections.com";

function parsePrice(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const sort = (url.searchParams.get("sort") ?? "relevance").trim();
  const category = (url.searchParams.get("category") ?? "").trim();
  const inStockOnly = url.searchParams.get("inStock") === "1";
  const minPrice = parsePrice(url.searchParams.get("minPrice"));
  const maxPrice = parsePrice(url.searchParams.get("maxPrice"));

  const convex = createConvexClient(context);
  const [categories, searchResult, suggestions, discoveryRaw] = await Promise.all([
    convex.query(api.categories.list),
    convex.query(api.products.search, {
      query: q || undefined,
      category_slug: category || undefined,
      in_stock_only: inStockOnly || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      sort,
      limit: 80,
    }),
    convex.query(api.products.searchSuggestions, {
      query: q,
      limit: 8,
    }),
    convex.query(api.products.discoveryModules, {
      limit: 8,
    }),
  ]);

  const mapRows = (rows: any[]) => (rows ?? []).map(mapProduct);

  return json({
    q,
    sort: searchResult.sort,
    correctedQuery: searchResult.corrected_query ?? suggestions.corrected_query,
    category,
    inStockOnly,
    minPrice,
    maxPrice,
    categories: categories ?? [],
    facets: searchResult.facets,
    total: searchResult.total,
    products: mapRows(searchResult.products ?? []),
    suggestions: {
      ...suggestions,
      products: (suggestions.products ?? []).map((item: any) => ({
        id: String(item.id),
        slug: item.slug,
        name: item.name,
        image: item.image,
        category: item.category,
        price: item.price,
        inStock: item.in_stock !== false,
      })),
    },
    discovery: {
      trendingNow: mapRows(discoveryRaw?.trending_now ?? []),
      topRated: mapRows(discoveryRaw?.top_rated ?? []),
      justDropped: mapRows(discoveryRaw?.just_dropped ?? []),
      budgetPicks: mapRows(discoveryRaw?.budget_picks ?? []),
      inStockNow: mapRows(discoveryRaw?.in_stock_now ?? []),
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const queryLabel = data?.q ? ` for "${data.q}"` : "";
  const title = `Search${queryLabel} | Ayzal Collections`;
  return [
    { title },
    { name: "description", content: "Find products fast with category, stock and price filters." },
    { name: "robots", content: "noindex,follow" },
    { property: "og:title", content: title },
    { property: "og:url", content: `${CANONICAL_BASE}/search` },
    { tagName: "link", rel: "canonical", href: `${CANONICAL_BASE}/search` },
  ];
};

export default function SearchRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="shop-page">
      <section className="pt-24 pb-8">
        <div className="shop-shell space-y-4">
          <p className="eyebrow text-[#6E6E6E]">Product Discovery</p>
          <h1 className="font-display text-[var(--font-display-tight)] text-[#111]">
            Find your next favorite look
          </h1>
          <p className="support-copy max-w-1xl">
            Search by style, fabric, occasion or SKU. Filters update instantly so customers can
            reach checkout with less friction.
          </p>
        </div>
      </section>

      <section className="pb-6">
        <div className="shop-shell">
          <Form method="get" className="ecom-card space-y-4 p-4 md:p-5">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
              <div className="input-pill">
                <input
                  name="q"
                  defaultValue={data.q}
                  placeholder="Search by product, fabric, color, occasion, or SKU"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <button type="submit" className="btn-primary px-6">
                Search
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <select
                name="category"
                defaultValue={data.category}
                className="border border-[#111]/10 px-3 py-2 text-sm bg-white rounded-xl"
              >
                <option value="">All Categories</option>
                {data.categories.map((category) => (
                  <option key={category._id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                name="sort"
                defaultValue={data.sort}
                className="border border-[#111]/10 px-3 py-2 text-sm bg-white rounded-xl"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="best-selling">Best Selling</option>
                <option value="top-rated">Top Rated</option>
              </select>

              <input
                name="minPrice"
                type="number"
                min={0}
                defaultValue={data.minPrice ?? ""}
                placeholder="Min Price"
                className="border border-[#111]/10 px-3 py-2 text-sm rounded-xl"
              />
              <input
                name="maxPrice"
                type="number"
                min={0}
                defaultValue={data.maxPrice ?? ""}
                placeholder="Max Price"
                className="border border-[#111]/10 px-3 py-2 text-sm rounded-xl"
              />

              <label className="inline-flex items-center gap-2 border border-[#111]/10 px-3 py-2 text-sm bg-white rounded-xl">
                <input type="checkbox" name="inStock" value="1" defaultChecked={data.inStockOnly} />
                In stock only
              </label>
            </div>

            {data.correctedQuery ? (
              <p className="text-xs text-[#6E6E6E]">
                Showing closest results.{" "}
                <Link
                  className="underline decoration-[#D4A05A]/60 underline-offset-2"
                  to={`/search?q=${encodeURIComponent(data.correctedQuery)}`}
                >
                  Search for "{data.correctedQuery}" instead
                </Link>
                .
              </p>
            ) : null}
          </Form>
        </div>
      </section>

      <section className="pb-6">
        <div className="shop-shell space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#6E6E6E]">
            <p>
              {data.total} result{data.total === 1 ? "" : "s"}
              {data.q ? ` for "${data.q}"` : ""}
            </p>
            <p>
              Price range: {formatPrice(data.facets.min_price)} - {formatPrice(data.facets.max_price)}
            </p>
          </div>

          {data.suggestions.hints?.length > 0 ? (
            <div className="rounded-xl border border-[#111]/10 bg-white/70 p-4">
              <p className="eyebrow mb-2 text-[#6E6E6E]">Try quick filters</p>
              <div className="flex flex-wrap gap-2">
                {data.suggestions.hints.slice(0, 8).map((hint: string) => (
                  <Link
                    key={hint}
                    to={`/search?q=${encodeURIComponent(hint)}`}
                    className="badge-chip border border-[#111]/10 bg-white text-[#111] hover:border-[#D4A05A] hover:text-[#D4A05A]"
                  >
                    {hint}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="pb-12">
        <div className="shop-shell">
          {data.products.length === 0 ? (
            <div className="ecom-card space-y-4 p-8 text-center">
              <h2 className="section-title">No products matched this search</h2>
              <p className="support-copy">
                Try broader keywords, remove one filter, or start from a discovery module below.
              </p>
              <Link to="/search" className="btn-primary inline-block">
                Reset Filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.products.map((product) => (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  microcopy="Loved for fit, finishing, and delivery speed."
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-20">
        <div className="shop-shell space-y-5">
          {data.suggestions.products?.length > 0 ? (
            <DiscoveryRail
              title="Suggested Picks"
              subtitle="High-intent matches from your current search behavior."
              items={data.suggestions.products}
              microcopy="Frequently selected before checkout."
            />
          ) : null}
          <DiscoveryRail
            title="Trending Right Now"
            subtitle="Best sellers currently converting across the store."
            items={data.discovery.trendingNow}
            microcopy="Popular this week."
          />
          <DiscoveryRail
            title="New Drops"
            subtitle="Fresh arrivals curated for this season."
            items={data.discovery.justDropped}
            microcopy="Just added to catalog."
          />
          <DiscoveryRail
            title="Value Picks"
            subtitle="High-demand styles under PKR 7,999."
            items={data.discovery.budgetPicks}
            microcopy="Budget friendly without compromising detail."
          />
          <DiscoveryRail
            title="Top Rated"
            subtitle="Products with the strongest verified customer feedback."
            items={data.discovery.topRated}
            microcopy="Loved by returning customers."
          />
          <DiscoveryRail
            title="Ready to Dispatch"
            subtitle="In-stock items prioritized for faster fulfillment."
            items={data.discovery.inStockNow}
            microcopy="Prepared for quick shipping."
          />
        </div>
      </section>
    </div>
  );
}
