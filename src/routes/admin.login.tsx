import type { MetaFunction } from "@remix-run/cloudflare";
import AdminLogin from "@/pages/admin/AdminLogin";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AdminLoginRoute() {
  return <AdminLogin />;
}
