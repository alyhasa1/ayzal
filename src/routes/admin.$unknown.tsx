import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { redirect } from "@remix-run/cloudflare";

export const meta: MetaFunction = () => [
  { name: "robots", content: "noindex, nofollow" },
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  if (params.unknown === "login") {
    return redirect("/admin/login", 302);
  }
  return redirect("/admin", 302);
};

export default function AdminUnknownRoute() {
  return null;
}
