import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import WishlistPage from "@/pages/WishlistPage";

export default function WishlistRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading your wishlist..." />}>
      <WishlistPage />
    </ClientConvexProvider>
  );
}
