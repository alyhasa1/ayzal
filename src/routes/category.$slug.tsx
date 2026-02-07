import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import { mapProduct } from "@/lib/mappers";
import DiscoveryRail from "@/components/shop/DiscoveryRail";
import ProductGridCard from "@/components/shop/ProductGridCard";

const CANONICAL_BASE = "https://ayzalcollections.com";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const convex = createConvexClient(context);
  const [category, productsRaw, discoveryRaw] = await Promise.all([
    convex.query(api.categories.getBySlug, { slug }),
    convex.query(api.products.listByCategorySlug, { slug }),
    convex.query(api.products.discoveryModules, {
      category_slug: slug,
      limit: 8,
    }),
  ]);
  if (!category) {
    throw new Response("Not Found", { status: 404 });
  }

  const mapRows = (rows: any[]) => (rows ?? []).map(mapProduct);
  const products = mapRows(productsRaw ?? []);

  return json({
    category,
    products,
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
  if (!data) return [];
  const title = `${data.category.name} | Ayzal Collections`;
  const description = `Explore ${data.category.name} pakistani dresses, lawn and unstitched lawn styles from Ayzal Collections.`;
  const url = `${CANONICAL_BASE}/category/${data.category.slug}`;
  const fallbackImage = `${CANONICAL_BASE}/og.png`;
  const candidateImage = data.products?.[0]?.image;
  const ogImage = candidateImage
    ? candidateImage.startsWith("http")
      ? candidateImage
      : `${CANONICAL_BASE}${candidateImage}`
    : fallbackImage;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: url },
  ];
};

export default function CategoryRoute() {
  const { category, products, discovery } = useLoaderData<typeof loader>();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${CANONICAL_BASE}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${CANONICAL_BASE}/category/${category.slug}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${CANONICAL_BASE}/product/${product.slug ?? product.id}`,
      name: product.name,
    })),
  };

  return (
    <div className="shop-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <section className="pt-24 pb-10">
        <div className="shop-shell">
          <p className="eyebrow text-[#6E6E6E] mb-2">Category</p>
          <h1 className="font-display text-[var(--font-display-tight)] text-[#111]">{category.name}</h1>
          <p className="support-copy mt-3 max-w-2xl">
            Discover curated {category.name} looks including Pakistani dresses, lawn, and
            unstitched styles. Every listing is optimized for fast decision making.
          </p>
        </div>
      </section>

      <section className="pb-14">
        <div className="shop-shell">
          {products.length === 0 ? (
            <div className="ecom-card p-8 text-center space-y-3">
              <h2 className="section-title">No products published yet</h2>
              <p className="support-copy">This category will be populated as soon as curation is complete.</p>
              <Link to="/" className="btn-primary inline-block">
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  microcopy="Selected for category relevance and conversion potential."
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="pb-20">
        <div className="shop-shell space-y-5">
          <DiscoveryRail
            title={`Trending in ${category.name}`}
            subtitle="High-intent products shoppers in this category choose first."
            items={discovery.trendingNow}
            microcopy="Popular right now."
          />
          <DiscoveryRail
            title="Top Rated in Category"
            subtitle="Verified review leaders in this style family."
            items={discovery.topRated}
            microcopy="Highly rated for quality."
          />
          <DiscoveryRail
            title="Just Dropped"
            subtitle="Fresh additions customers are currently exploring."
            items={discovery.justDropped}
            microcopy="Recently added."
          />
          <DiscoveryRail
            title="Budget-Friendly Picks"
            subtitle="Strong-value options for first-time buyers."
            items={discovery.budgetPicks}
            microcopy="Under popular price thresholds."
          />
          <DiscoveryRail
            title="Ready to Dispatch"
            subtitle="In-stock styles prepared for quicker shipping."
            items={discovery.inStockNow}
            microcopy="Fast fulfillment candidates."
          />
        </div>
      </section>
    </div>
  );
}
