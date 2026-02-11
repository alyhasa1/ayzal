import { CANONICAL_ORIGIN } from "@/lib/seo";

export const loader = async () => {
  const body = [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /account",
    "Disallow: /checkout",
    `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
