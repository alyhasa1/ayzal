import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import ReturnsNewPage from "@/pages/ReturnsNewPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function ReturnsNewRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading returns portal..." />}>
      <ReturnsNewPage />
    </ClientConvexProvider>
  );
}
