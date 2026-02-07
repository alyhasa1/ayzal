import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import SupportTicketDetailPage from "@/pages/SupportTicketDetailPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function SupportTicketDetailRoute() {
  return (
    <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
      <SupportTicketDetailPage />
    </ClientConvexProvider>
  );
}
