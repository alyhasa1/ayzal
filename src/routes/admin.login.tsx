import type { MetaFunction } from "@remix-run/cloudflare";
import AdminLogin from "@/pages/admin/AdminLogin";
import ClientConvexProvider from "@/components/ClientConvexProvider";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AdminLoginRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#0B0F17]" />}>
      <AdminLogin />
    </ClientConvexProvider>
  );
}
