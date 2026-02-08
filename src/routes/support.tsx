import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import SupportPage from "@/pages/SupportPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function SupportRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading support center..." />}>
      <SupportPage />
    </ClientConvexProvider>
  );
}
