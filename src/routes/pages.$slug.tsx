import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import { canonicalUrl } from "@/lib/seo";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const convex = createConvexClient(context);
  const page = await convex.query(api.content.getPageBySlug, { slug });

  if (!page) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ page });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];

  const resolvedCanonicalUrl =
    data.page.canonical_url || canonicalUrl(`/pages/${data.page.slug}`);
  const title = data.page.meta_title || `${data.page.title} | Ayzal Collections`;
  const description =
    data.page.meta_description ||
    `Read ${data.page.title} from Ayzal Collections.`;

  const meta: ReturnType<MetaFunction<typeof loader>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: resolvedCanonicalUrl },
    { tagName: "link", rel: "canonical", href: resolvedCanonicalUrl },
  ];

  if (data.page.noindex) {
    meta.push({ name: "robots", content: "noindex,follow" });
  }

  return meta;
};

export default function ContentPageRoute() {
  const data = useLoaderData<typeof loader>();
  const page = data.page;
  const sections = page.body
    ? page.body
        .split(/\n{2,}/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#F6F2EE]">
      <section className="pt-24 pb-8 px-6 lg:px-12">
        <div className="max-w-1xl mx-auto space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Information</p>
          <h1 className="font-display text-1xl md:text-5xl text-[#111] leading-tight">{page.title}</h1>
        </div>
      </section>

      <section className="px-6 lg:px-12 pb-20">
        <article className="max-w-1xl mx-auto bg-white border border-[#111]/10 p-6 md:p-8 space-y-5">
          {sections.length > 0 ? (
            sections.map((section, index) => (
              <p key={`${page.slug}-${index}`} className="text-[15px] leading-7 text-[#2D2D2D] whitespace-pre-line">
                {section}
              </p>
            ))
          ) : (
            <p className="text-[15px] leading-7 text-[#2D2D2D]">
              This page has no content yet. Add page copy in Admin Settings.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
