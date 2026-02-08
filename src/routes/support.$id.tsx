import type { MetaFunction } from "@remix-run/cloudflare";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import BrandLoader from "@/components/BrandLoader";
import SupportTicketDetailPage from "@/pages/SupportTicketDetailPage";

export const meta: MetaFunction = () => [{ name: "robots", content: "noindex, nofollow" }];

export default function SupportTicketDetailRoute() {
  return (
    <ClientConvexProvider fallback={<BrandLoader label="Loading support ticket..." />}>
      <SupportTicketDetailPage />
    </ClientConvexProvider>
  );
}
