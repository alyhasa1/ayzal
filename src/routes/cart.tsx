import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import CartPage from "@/pages/CartPage";

export default function CartRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading your bag..." />}>
      <CartPage />
    </ClientConvexProvider>
  );
}
