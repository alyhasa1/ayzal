import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import WishlistPage from "@/pages/WishlistPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function WishlistRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading your wishlist..." />}>
      <WishlistPage />
    </ClientConvexProvider>
  );
}
