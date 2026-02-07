import ClientConvexProvider from "@/components/ClientConvexProvider";
import WishlistPage from "@/pages/WishlistPage";

export default function WishlistRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <WishlistPage />
    </ClientConvexProvider>
  );
}
