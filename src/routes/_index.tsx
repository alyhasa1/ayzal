import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import HomePage from "@/pages/HomePage";
import { createConvexClient } from "@/lib/convex.server";

const CANONICAL_BASE = "https://ayzalcollections.com";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const convex = createConvexClient(context);
  const homeData = await convex.query(api.siteHome.get);
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
