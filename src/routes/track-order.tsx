import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import TrackOrderPage from "@/pages/TrackOrderPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function TrackOrderRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <TrackOrderPage />
    </ClientConvexProvider>
  );
}
