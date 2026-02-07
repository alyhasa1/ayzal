import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import SupportPage from "@/pages/SupportPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function SupportRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <SupportPage />
    </ClientConvexProvider>
  );
}
