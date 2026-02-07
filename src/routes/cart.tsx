import ClientConvexProvider from "@/components/ClientConvexProvider";
import CartPage from "@/pages/CartPage";

export default function CartRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <CartPage />
    </ClientConvexProvider>
  );
}
