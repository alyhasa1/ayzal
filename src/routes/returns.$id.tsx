import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import ReturnDetailPage from "@/pages/ReturnDetailPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function ReturnDetailRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <ReturnDetailPage />
    </ClientConvexProvider>
  );
}
