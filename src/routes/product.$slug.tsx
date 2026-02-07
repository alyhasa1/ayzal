import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import { mapProduct } from "@/lib/mappers";
import { dedupeProductsById } from "@/lib/commerce";
import ClientConvexProvider from "@/components/ClientConvexProvider";
import ProductPage from "@/pages/ProductPage";

const CANONICAL_BASE = "https://ayzalcollections.com";
const DEFAULT_OG = "/og.png";

export const loader = async ({ params, context }: LoaderFunctionArgs) => {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const convex = createConvexClient(context);
  const result = await convex.query(api.products.getBySlugOrId, { slugOrId: slug });
  if (!result || !result.product) {
    throw new Response("Not Found", { status: 404 });
  }

  const product = mapProduct(result.product);
  const canonicalSlug = product.slug ?? product.id;
  if (result.matchedBy === "id" || slug !== canonicalSlug) {
    return redirect(`/product/${canonicalSlug}`, 301);
  }

  const [relatedRaw, bestSellerRaw, topRatedRaw, reviewsRaw, recommendationRaw] =
    await Promise.all([
    convex.query(api.products.listRelated, {
      productId: result.product._id,
    }),
    convex.query(api.products.search, {
      sort: "best-selling",
      limit: 10,
    }),
    convex.query(api.products.search, {
      sort: "top-rated",
      limit: 10,
    }),
    convex.query(api.reviews.listForProduct, {
      product_id: result.product._id,
    }),
    convex.query(api.products.recommendationBundle, {
      product_id: result.product._id,
      limit: 10,
    }),
  ]);

  const mapRows = (rows: any[]) => rows.map(mapProduct);
  const relatedProducts = dedupeProductsById(mapRows(relatedRaw ?? []), {
    excludeIds: [product.id],
    limit: 8,
  });
  const bestSellerProducts = dedupeProductsById(mapRows(bestSellerRaw?.products ?? []), {
    excludeIds: [product.id],
    limit: 8,
  });
  const topRatedProducts = dedupeProductsById(mapRows(topRatedRaw?.products ?? []), {
    excludeIds: [product.id],
    limit: 8,
  });
  const frequentlyBoughtTogether = dedupeProductsById(
    mapRows(recommendationRaw?.frequently_bought_together ?? []),
    {
      excludeIds: [product.id],
      limit: 8,
    }
  );
  const completeTheLook = dedupeProductsById(
    mapRows(recommendationRaw?.complete_the_look ?? []),
    {
      excludeIds: [product.id],
      limit: 8,
    }
  );
  const tagMatchProducts = dedupeProductsById(mapRows(recommendationRaw?.tag_matches ?? []), {
    excludeIds: [product.id],
    limit: 8,
  });
  const reviews = (reviewsRaw ?? []).map((review) => ({
    id: String(review._id),
    rating: review.rating,
    title: review.title,
    body: review.body,
    guestName: review.guest_name,
    verifiedPurchase: review.verified_purchase,
    createdAt: review.created_at,
    helpfulCount: review.helpful_count,
  }));
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? Number(
          (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviewCount
          ).toFixed(1)
        )
      : 0;

  return json({
    product,
    relatedProducts,
    bestSellerProducts,
    topRatedProducts,
    frequentlyBoughtTogether,
    completeTheLook,
    tagMatchProducts,
    reviews,
    reviewStats: {
      count: reviewCount,
      average: averageRating,
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [];
  const { product } = data;
  const title = product.metaTitle || `${product.name} | Ayzal Collections`;
  const description =
    product.metaDescription ||
    product.description ||
    "Shop Ayzal Collections for pakistani dresses, lawn and unstitched lawn styles.";
  const ogImage = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${CANONICAL_BASE}${product.image}`
    : `${CANONICAL_BASE}${DEFAULT_OG}`;
  const url = `${CANONICAL_BASE}/product/${product.slug ?? product.id}`;

  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "product" },
    { property: "og:url", content: url },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
    { property: "product:price:amount", content: String(product.price) },
    { property: "product:price:currency", content: "PKR" },
    { tagName: "link", rel: "canonical", href: url },
  ];
};

export default function ProductRoute() {
  const {
    product,
    relatedProducts,
    bestSellerProducts,
    topRatedProducts,
    frequentlyBoughtTogether,
    completeTheLook,
    tagMatchProducts,
    reviews,
    reviewStats,
  } = useLoaderData<typeof loader>();

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
        name: product.category,
        item: product.categorySlug
          ? `${CANONICAL_BASE}/category/${product.categorySlug}`
          : `${CANONICAL_BASE}/#products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${CANONICAL_BASE}/product/${product.slug ?? product.id}`,
      },
    ],
  };

  const productUrl = `${CANONICAL_BASE}/product/${product.slug ?? product.id}`;

  const productSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: productUrl,
    image: product.images && product.images.length > 0 ? product.images : [product.image],
    description: product.description,
    sku: product.sku,
    category: product.category,
    itemCondition: "https://schema.org/NewCondition",
    brand: {
      "@type": "Brand",
      name: "Ayzal Collections",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: productUrl,
    },
  };

  if (product.fabric) {
    productSchema.material = product.fabric;
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <ClientConvexProvider fallback={<div className="min-h-screen bg-[#F6F2EE]" />}>
        <ProductPage
          product={product}
          relatedProducts={relatedProducts}
          bestSellerProducts={bestSellerProducts}
          topRatedProducts={topRatedProducts}
          frequentlyBoughtTogether={frequentlyBoughtTogether}
          completeTheLook={completeTheLook}
          tagMatchProducts={tagMatchProducts}
          reviews={reviews}
          reviewStats={reviewStats}
        />
      </ClientConvexProvider>
    </>
  );
}
