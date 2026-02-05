import type { MetaFunction } from "@remix-run/cloudflare";
import CheckoutPage from "@/pages/CheckoutPage";
import RequireAuth from "@/components/RequireAuth";
import ClientConvexProvider from "@/components/ClientConvexProvider";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function CheckoutRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <RequireAuth redirectTo="/account/login">
        <CheckoutPage />
      </RequireAuth>
    </ClientConvexProvider>
  );
}
