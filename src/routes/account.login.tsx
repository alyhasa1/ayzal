import type { MetaFunction } from "@remix-run/cloudflare";
import AccountLogin from "@/pages/account/AccountLogin";
import ClientConvexProvider from "@/components/ClientConvexProvider";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AccountLoginRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <AccountLogin />
    </ClientConvexProvider>
  );
}
