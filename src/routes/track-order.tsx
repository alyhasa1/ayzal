import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import TrackOrderPage from "@/pages/TrackOrderPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function TrackOrderRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading order tracking..." />}>
      <TrackOrderPage />
    </ClientConvexProvider>
  );
}
