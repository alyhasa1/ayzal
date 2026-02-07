import type { MetaFunction } from "@remix-run/cloudflare";
import { useParams } from "@remix-run/react";
import CheckoutSuccessPage from "@/pages/checkout/CheckoutSuccessPage";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function CheckoutSuccessRoute() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  return <CheckoutSuccessPage orderNumber={orderNumber ?? ""} />;
}
