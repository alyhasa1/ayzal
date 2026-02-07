const CANONICAL_BASE = "https://ayzalcollections.com";

export const loader = async () => {
  const body = [
    "User-agent: *",
    "Disallow: /admin",
    "Disallow: /account",
    "Disallow: /checkout",
    `Sitemap: ${CANONICAL_BASE}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
