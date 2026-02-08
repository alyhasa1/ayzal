import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import { Navigate, Outlet, useLocation } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function CheckoutRoute() {
  const location = useLocation();
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Preparing checkout..." />}>
      {location.pathname === "/checkout" ? (
        <Navigate to="/checkout/information" replace />
      ) : (
        <Outlet />
      )}
    </ClientConvexProvider>
  );
}
