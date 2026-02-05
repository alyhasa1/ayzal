import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import { mapProduct } from "@/lib/mappers";
import { formatPrice } from "@/lib/format";

const CANONICAL_BASE = "https://ayzalcollections.com";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const convex = createConvexClient(context);
  const category = await convex.query(api.categories.getBySlug, { slug });
  if (!category) {
    throw new Response("Not Found", { status: 404 });
  }

  const productsRaw = await convex.query(api.products.listByCategorySlug, { slug });
  const products = (productsRaw ?? []).map(mapProduct);

  return json({ category, products });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  const title = `${data.category.name} | Ayzal Collections`;
  const description = `Explore ${data.category.name} pakistani dresses, lawn and unstitched lawn styles from Ayzal Collections.`;
  const url = `${CANONICAL_BASE}/category/${data.category.slug}`;
  const fallbackImage = `${CANONICAL_BASE}/og.png`;
  const candidateImage = data.products?.[0]?.image;
  const ogImage = candidateImage
    ? candidateImage.startsWith("http")
      ? candidateImage
      : `${CANONICAL_BASE}${candidateImage}`
    : fallbackImage;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: ogImage },
    { tagName: "link", rel: "canonical", href: url },
  ];
};

export default function CategoryRoute() {
  const { category, products } = useLoaderData<typeof loader>();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${CANONICAL_BASE}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `${CANONICAL_BASE}/category/${category.slug}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${CANONICAL_BASE}/product/${product.slug ?? product.id}`,
      name: product.name,
    })),
  };

  return (
    <div className="min-h-screen bg-[#F6F2EE]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="pt-24 pb-10 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <p className="label-text text-[#6E6E6E] mb-2">Category</p>
          <h1 className="headline-lg text-3xl md:text-4xl text-[#111]">{category.name}</h1>
          <p className="text-sm text-[#6E6E6E] mt-3 max-w-2xl">
            Discover curated {category.name} looks including pakistani dresses, lawn and unstitched lawn styles.
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-12 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="group rounded-2xl border border-[#111]/10 bg-white/60 shadow-sm transition-shadow hover:shadow-lg p-4"
            >
              <Link
                to={`/product/${product.slug ?? product.id}`}
                className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 mb-4 block"
              >
                <img
                  src={product.image}
                  alt={`${product.name} - ${product.category} Pakistani Dress`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </Link>
              <div className="space-y-1">
                <p className="label-text text-[#6E6E6E]">{product.category}</p>
                <Link
                  to={`/product/${product.slug ?? product.id}`}
                  className="font-medium text-sm text-[#111] hover:text-[#D4A05A] transition-colors text-left block"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-[#6E6E6E]">{formatPrice(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
