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
    <article className="group border bg-[#fffaf4] p-2.5 md:p-3" style={{ borderColor: '#eff2e6' }}>
      <Link
        to={`/product/${product.slug ?? product.id}`}
        className="relative mb-3 block aspect-[4/5] overflow-hidden bg-gray-100"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.isNewArrival ? (
            <span className="border border-[#111]/15 bg-white/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#111] rounded-none">
              New Drop
            </span>
          ) : null}
          {product.inStock === false ? (
            <span className="border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-600 rounded-none">
              Out of Stock
            </span>
          ) : (
            <span className="border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 rounded-none">
              Ready to Ship
            </span>
          )}
        </div>
      </Link>
      <div className="space-y-1">
        <p className="eyebrow text-[#6E6E6E]">{product.category || "Ayzal Edit"}</p>
        <Link
          to={`/product/${product.slug ?? product.id}`}
          className="line-clamp-2 text-[15px] leading-snug font-medium text-[#111] transition-colors hover:text-[#D4A05A]"
        >
          {product.name}
        </Link>
        <p className="font-medium text-[#111]">{formatPrice(product.price)}</p>
        {microcopy ? <p className="text-[11px] text-[#6E6E6E] leading-snug">{microcopy}</p> : null}
      </div>
    </article>
  );
}
