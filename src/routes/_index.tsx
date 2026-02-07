import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import HomePage from "@/pages/HomePage";
import { createConvexClient } from "@/lib/convex.server";
import { mapProduct } from "@/lib/mappers";

const CANONICAL_BASE = "https://ayzalcollections.com";

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

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { property: "og:url", content: `${CANONICAL_BASE}/` },
    { tagName: "link", rel: "canonical", href: `${CANONICAL_BASE}/` },
  ];
};

export default function IndexRoute() {
  const { homeData } = useLoaderData<typeof loader>();
  return <HomePage homeData={homeData} />;
}
