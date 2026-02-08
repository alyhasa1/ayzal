import ProductGridCard from "@/components/shop/ProductGridCard";

type RailProduct = {
  id: string;
  slug?: string;
  name: string;
  image: string;
  category?: string;
  price: number;
  isNewArrival?: boolean;
  inStock?: boolean;
};

export default function DiscoveryRail({
  title,
  subtitle,
  items,
  microcopy,
}: {
  title: string;
  subtitle?: string;
  items: RailProduct[];
  microcopy?: string;
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-4 rounded-xl border border-[#111]/10 bg-white/70 p-4 md:p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-[#111]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#6E6E6E]">{subtitle}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductGridCard key={item.id} product={item} microcopy={microcopy} />
        ))}
      </div>
    </section>
  );
}
