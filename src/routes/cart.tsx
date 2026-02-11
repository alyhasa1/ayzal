import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import CartPage from "@/pages/CartPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function CartRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading your bag..." />}>
      <CartPage />
    </ClientConvexProvider>
  );
}
