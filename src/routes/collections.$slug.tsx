import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import { mapProduct } from "@/lib/mappers";
import DiscoveryRail from "@/components/shop/DiscoveryRail";
import ProductGridCard from "@/components/shop/ProductGridCard";

const CANONICAL_BASE = "https://ayzalcollections.com";

export const loader = async ({ params, request, context }: LoaderFunctionArgs) => {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const url = new URL(request.url);
  const sort = (url.searchParams.get("sort") ?? "manual").trim();
  const convex = createConvexClient(context);
  const [result, discoveryRaw] = await Promise.all([
    convex.query(api.collections.getPublicWithProducts, {
      slug,
      sort,
    }),
    convex.query(api.products.discoveryModules, {
      limit: 8,
    }),
  ]);

  if (!result) {
    throw new Response("Not Found", { status: 404 });
  }

  const mapRows = (rows: any[]) => (rows ?? []).map(mapProduct);

  return json({
    collection: result.collection,
    sort: result.sort,
    total: result.total,
    products: mapRows(result.products ?? []),
    discovery: {
      trendingNow: mapRows(discoveryRaw?.trending_now ?? []),
      topRated: mapRows(discoveryRaw?.top_rated ?? []),
      justDropped: mapRows(discoveryRaw?.just_dropped ?? []),
      inStockNow: mapRows(discoveryRaw?.in_stock_now ?? []),
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  const title = `${data.collection.name} | Ayzal Collections`;
  const description =
    data.collection.description ??
    `Shop ${data.collection.name} edits with curated styles and fast delivery.`;
  const url = `${CANONICAL_BASE}/collections/${data.collection.slug}`;
  const ogImage = data.collection.image_url || `${CANONICAL_BASE}/og.png`;
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: url },
  ];
};

export default function CollectionRoute() {
  const data = useLoaderData<typeof loader>();
  const collection = data.collection;

  return (
    <div className="shop-page">
      <section className="pt-24 pb-8">
        <div className="shop-shell">
          <p className="eyebrow text-[#6E6E6E] mb-2">Collection</p>
          <h1 className="font-display text-[var(--font-display-tight)] text-[#111]">{collection.name}</h1>
          {collection.description ? (
            <p className="support-copy mt-3 max-w-1xl">{collection.description}</p>
          ) : null}
          <p className="mt-2 text-xs uppercase tracking-widest text-[#6E6E6E]">
            Curated for discovery, conversion, and faster decision making.
          </p>
        </div>
      </section>

      <section className="pb-6">
        <div className="shop-shell">
          <div className="ecom-card p-4 md:p-5">
            <Form method="get" className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#6E6E6E]">
                {data.total} product{data.total === 1 ? "" : "s"} in this collection
              </p>
              <div className="inline-flex items-center gap-3">
                <label htmlFor="collection-sort" className="eyebrow text-[#6E6E6E]">
                  Sort
                </label>
                <select
                  id="collection-sort"
                  name="sort"
                  defaultValue={data.sort}
                  className="border border-[#111]/10 px-3 py-2 text-sm bg-white rounded-xl"
                >
                  <option value="manual">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="spotlight">Spotlight</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                </select>
                <button type="submit" className="btn-primary px-4 py-2">
                  Apply
                </button>
              </div>
            </Form>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="shop-shell">
          {data.products.length === 0 ? (
            <div className="ecom-card p-8 text-center space-y-3">
              <h2 className="section-title">Collection is being curated</h2>
              <p className="support-copy">
                Products will appear here once merchandising is finalized.
              </p>
              <Link to="/" className="btn-primary inline-block">
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data.products.map((product) => (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  microcopy="Chosen for fit, finish, and repeat-purchase demand."
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-20">
        <div className="shop-shell space-y-5">
          <DiscoveryRail
            title="Trending Right Now"
            subtitle="High-conversion products currently selected by most shoppers."
            items={data.discovery.trendingNow}
            microcopy="Frequently purchased in the last few days."
          />
          <DiscoveryRail
            title="Top Rated Picks"
            subtitle="Verified customer feedback favorites."
            items={data.discovery.topRated}
            microcopy="Rated highly for quality and finish."
          />
          <DiscoveryRail
            title="New Arrivals"
            subtitle="Fresh launches worth exploring next."
            items={data.discovery.justDropped}
            microcopy="Recently added to catalog."
          />
          <DiscoveryRail
            title="Ready to Dispatch"
            subtitle="In-stock selections for faster fulfillment."
            items={data.discovery.inStockNow}
            microcopy="Ships quickly once confirmed."
          />
        </div>
      </section>
    </div>
  );
}
