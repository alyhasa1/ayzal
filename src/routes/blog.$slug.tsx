import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";

const CANONICAL_BASE = "https://ayzalcollections.com";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const convex = createConvexClient(context);
  const post = await convex.query(api.content.getPostBySlug, { slug });

  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ post });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];

  const canonicalUrl =
    data.post.canonical_url || `${CANONICAL_BASE}/blog/${data.post.slug}`;
  const title = data.post.meta_title || `${data.post.title} | Ayzal Journal`;
  const description =
    data.post.meta_description ||
    data.post.excerpt ||
    "Read this latest Ayzal Journal article.";
  const tags = data.post.tags.length > 0 ? data.post.tags.join(", ") : undefined;

  const meta: ReturnType<MetaFunction<typeof loader>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: canonicalUrl },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
  ];

  if (data.post.cover_image) {
    meta.push({ property: "og:image", content: data.post.cover_image });
  }
  if (tags) {
    meta.push({ name: "keywords", content: tags });
  }
  if (data.post.noindex) {
    meta.push({ name: "robots", content: "noindex,follow" });
  }

  return meta;
};

function formatPublishedDate(value: number) {
  try {
    return new Intl.DateTimeFormat("en-PK", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function BlogPostRoute() {
  const data = useLoaderData<typeof loader>();
  const post = data.post;
  const publishedDate = new Date(post.published_at).toISOString();
  const modifiedDate = new Date(post.updated_at).toISOString();
  const canonicalUrl =
    post.canonical_url || `${CANONICAL_BASE}/blog/${post.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      name: post.author || "Ayzal Editorial",
    },
    image: post.cover_image ? [post.cover_image] : undefined,
    description: post.excerpt || post.meta_description || undefined,
    mainEntityOfPage: canonicalUrl,
    keywords: post.tags.join(", "),
    publisher: {
      "@type": "Organization",
      name: "Ayzal Collections",
      logo: {
        "@type": "ImageObject",
        url: `${CANONICAL_BASE}/og.png`,
      },
    },
  };

  const paragraphs = post.content
    ? post.content
        .split(/\n{2,}/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-[#F6F2EE]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <section className="pt-24 pb-8 px-6 lg:px-12">
        <div className="max-w-3xl mx-auto space-y-4">
          <Link to="/blog" className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]">
            Back to Journal
          </Link>
          <h1 className="font-display text-3xl md:text-5xl text-[#111] leading-tight">{post.title}</h1>
          <p className="text-sm text-[#6E6E6E]">
            {formatPublishedDate(post.published_at)} by {post.author || "Ayzal Editorial"}
          </p>
        </div>
      </section>

      {post.cover_image ? (
        <section className="px-6 lg:px-12 pb-8">
          <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-[#111]/10">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        </section>
      ) : null}

      <section className="px-6 lg:px-12 pb-20">
        <article className="max-w-3xl mx-auto bg-white border border-[#111]/10 p-6 md:p-8 space-y-5">
          {post.excerpt ? (
            <p className="text-base text-[#2D2D2D] leading-relaxed">{post.excerpt}</p>
          ) : null}

          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p key={`${post.slug}-${index}`} className="text-[15px] leading-7 text-[#2D2D2D] whitespace-pre-line">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-[15px] leading-7 text-[#2D2D2D]">
              This article has no body content yet. Add full copy in Admin Settings.
            </p>
          )}
        </article>
      </section>
    </div>
  );
}
