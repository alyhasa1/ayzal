import type { MetaFunction } from "@remix-run/cloudflare";
import AccountLayout from "@/pages/account/AccountLayout";
import RequireAuth from "@/components/RequireAuth";
import ClientConvexProvider from "@/components/ClientConvexProvider";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AccountRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <RequireAuth redirectTo="/account/login">
        <AccountLayout />
      </RequireAuth>
    </ClientConvexProvider>
  );
}
