import type { MetaFunction } from "@remix-run/cloudflare";
import AdminLayout from "@/pages/admin/AdminLayout";
import RequireAdmin from "@/components/RequireAdmin";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import { Outlet, useLocation } from "@remix-run/react";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AdminRoute() {
  const location = useLocation();
  const isLoginRoute = location.pathname === "/admin/login";

  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      {isLoginRoute ? (
        <Outlet />
      ) : (
        <RequireAdmin>
          <AdminLayout />
        </RequireAdmin>
      )}
    </ClientConvexProvider>
  );
}
