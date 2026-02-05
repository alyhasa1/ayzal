import type { MetaFunction } from "@remix-run/cloudflare";
import AccountLogin from "@/pages/account/AccountLogin";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export default function AccountLoginRoute() {
  return <AccountLogin />;
}
