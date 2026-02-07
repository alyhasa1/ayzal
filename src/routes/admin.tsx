import type { MetaFunction } from "@remix-run/cloudflare";
import AdminLayout from "@/pages/admin/AdminLayout";
import RequireAdmin from "@/components/RequireAdmin";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
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

export function ErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Unexpected admin panel error";

  return (
    <div className="min-h-screen bg-[#F6F2EE] text-[#111] px-4 py-14">
      <div className="max-w-2xl mx-auto border border-[#111]/15 bg-white/90 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#111]/55 mb-2">
          Admin Panel
        </p>
        <h1 className="font-display text-2xl mb-3">Something went wrong</h1>
        <p className="text-sm text-[#111]/70">
          The page hit an error. Refresh once, and if it repeats open another tab so you can keep
          working while we inspect this module.
        </p>
        <pre className="mt-4 p-3 text-xs bg-[#111]/5 overflow-auto border border-[#111]/10">
          {message}
        </pre>
      </div>
    </div>
  );
}
