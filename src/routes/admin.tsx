import type { MetaFunction } from "@remix-run/cloudflare";
import AdminLayout from "@/pages/admin/AdminLayout";
import RequireAdmin from "@/components/RequireAdmin";
import ClientConvexProvider from "@/components/ClientConvexProvider";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AdminRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}> 
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    </ClientConvexProvider>
  );
}
