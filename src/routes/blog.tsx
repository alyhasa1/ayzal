import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import { canonicalUrl } from "@/lib/seo";

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const convex = createConvexClient(context);
  const posts = await convex.query(api.content.listPosts);
  return json({
    posts: posts ?? [],
  });
};

export const meta: MetaFunction<typeof loader> = () => {
  const title = "Ayzal Journal | Style, Fabric Care and Trend Guides";
  const description =
    "Read styling tips, seasonal trend reports, and care guides from the Ayzal editorial team.";

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl("/blog") },
    { tagName: "link", rel: "canonical", href: canonicalUrl("/blog") },
  ];
};

function formatPublishedDate(value: number) {
  try {
    return new Intl.DateTimeFormat("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function BlogIndexRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-[#F6F2EE]">
      <section className="pt-24 pb-8 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Ayzal Journal</p>
          <h1 className="font-display text-1xl md:text-5xl text-[#111]">
            Content built for conversion and confidence
          </h1>
          <p className="text-sm text-[#6E6E6E] max-w-1xl">
            Browse styling guides, launch stories, and care notes that help customers buy with
            confidence.
          </p>
        </div>
      </section>

      <section className="px-6 lg:px-12 pb-20">
        <div className="max-w-6xl mx-auto">
          {data.posts.length === 0 ? (
            <div className="bg-white border border-[#111]/10 p-8 text-center space-y-3">
              <h2 className="font-display text-xl text-[#111]">Journal content coming soon</h2>
              <p className="text-sm text-[#6E6E6E]">
                Add blog posts in Admin Settings to publish your first SEO article.
              </p>
              <Link to="/" className="btn-primary inline-block">
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.posts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-xl border border-[#111]/10 bg-white/90 overflow-hidden shadow-sm"
                >
                  {post.cover_image ? (
                    <Link to={`/blog/${post.slug}`} className="block">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full aspect-[16/10] object-cover"
                        loading="lazy"
                      />
                    </Link>
                  ) : null}
                  <div className="p-5 space-y-3">
                    <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
                      {formatPublishedDate(post.published_at)} by {post.author || "Ayzal Editorial"}
                    </p>
                    <h2 className="font-display text-xl text-[#111] leading-tight">
                      <Link to={`/blog/${post.slug}`} className="hover:text-[#D4A05A] transition-colors">
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt ? (
                      <p className="text-sm text-[#4A4A4A] leading-relaxed">{post.excerpt}</p>
                    ) : null}
                    {post.tags && post.tags.length > 0 ? (
                      <p className="text-xs text-[#6E6E6E]">{post.tags.map((tag) => `#${tag}`).join(" ")}</p>
                    ) : null}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center text-sm font-medium text-[#111] hover:text-[#D4A05A] transition-colors"
                    >
                      Read article
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
