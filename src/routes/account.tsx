import type { MetaFunction } from "@remix-run/cloudflare";
import AccountLayout from "@/pages/account/AccountLayout";
import RequireAuth from "@/components/RequireAuth";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import { Outlet, useLocation } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AccountRoute() {
  const location = useLocation();
  const isLoginRoute = location.pathname === "/account/login";

  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading account space..." />}>
      {isLoginRoute ? (
        <Outlet />
      ) : (
        <RequireAuth redirectTo="/account/login">
          <AccountLayout />
        </RequireAuth>
      )}
    </ClientConvexProvider>
  );
}
