import { Link } from "@remix-run/react";
import { formatPrice } from "@/lib/format";

type ProductCardRow = {
  id: string;
  slug?: string;
  name: string;
  image: string;
  category?: string;
  price: number;
  isNewArrival?: boolean;
  inStock?: boolean;
};

export default function ProductGridCard({
  product,
  microcopy,
}: {
  product: ProductCardRow;
  microcopy?: string;
}) {
  return (
    <article className="product-card-v2 group">
      <Link
        to={`/product/${product.slug ?? product.id}`}
        className="relative mb-4 block aspect-[4/5] overflow-hidden rounded-xl bg-gray-100"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.isNewArrival ? (
            <span className="badge-chip bg-white/95 text-[#111] border border-[#111]/10">New Drop</span>
          ) : null}
          {product.inStock === false ? (
            <span className="badge-chip bg-red-50 text-red-600 border border-red-200">Out of Stock</span>
          ) : (
            <span className="badge-chip bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ready to Ship
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-1.5">
        <p className="eyebrow text-[#6E6E6E]">{product.category || "Ayzal Edit"}</p>
        <Link
          to={`/product/${product.slug ?? product.id}`}
          className="line-clamp-2 text-sm font-medium text-[#111] transition-colors hover:text-[#D4A05A]"
        >
          {product.name}
        </Link>
        <p className="font-medium text-[#111]">{formatPrice(product.price)}</p>
        {microcopy ? <p className="text-xs text-[#6E6E6E]">{microcopy}</p> : null}
      </div>
    </article>
  );
}
