import type { HeadersFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import HomePage from "@/pages/HomePage";
import { createConvexClient } from "@/lib/convex.server";
import { mapProduct } from "@/lib/mappers";
import { canonicalUrl, DEFAULT_HOME_SEO, toAbsoluteUrl } from "@/lib/seo";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const convex = createConvexClient(context);
  const [homeDataRaw, discoveryRaw] = await Promise.all([
    convex.query(api.siteHome.get),
    convex.query(api.products.discoveryModules, { limit: 8 }),
  ]);
  const mapRows = (rows: any[]) => (rows ?? []).map(mapProduct);
  const homeData = {
    ...homeDataRaw,
    discovery: {
      trendingNow: mapRows(discoveryRaw?.trending_now ?? []),
      topRated: mapRows(discoveryRaw?.top_rated ?? []),
      justDropped: mapRows(discoveryRaw?.just_dropped ?? []),
      budgetPicks: mapRows(discoveryRaw?.budget_picks ?? []),
      inStockNow: mapRows(discoveryRaw?.in_stock_now ?? []),
    },
  };
  return json({ homeData });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const seo = { ...DEFAULT_HOME_SEO, ...(data?.homeData?.settings?.seo ?? {}) };
  const title = seo.title;
  const description = seo.description;
  const ogImage = toAbsoluteUrl(typeof seo.og_image === "string" ? seo.og_image : "/og.png");

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: seo.keywords ?? DEFAULT_HOME_SEO.keywords },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl("/") },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: canonicalUrl("/") },
  ];
};

export const headers: HeadersFunction = ({ parentHeaders }) => {
  const out = new Headers(parentHeaders);
  out.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
  return out;
};

export default function IndexRoute() {
  const { homeData } = useLoaderData<typeof loader>();
  const brandName = homeData?.settings?.brand_name ?? "Ayzal Collections";
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandName,
    url: canonicalUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonicalUrl("/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <HomePage homeData={homeData} />
    </>
  );
}
