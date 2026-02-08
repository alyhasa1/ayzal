import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import ReturnDetailPage from "@/pages/ReturnDetailPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function ReturnDetailRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading return details..." />}>
      <ReturnDetailPage />
    </ClientConvexProvider>
  );
}
