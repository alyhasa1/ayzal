import { useRef } from 'react';
import { useNavigate } from '@remix-run/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { formatPrice } from '@/lib/format';
import { mapProduct } from '@/lib/mappers';
import { useCart } from '@/hooks/useCart';
import { Plus } from 'lucide-react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { ensureScrollTrigger } from '@/lib/gsap';

export default function NewArrivalsSection({ data }: { data?: any }) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const homeData = data?.homeData;
  const sourceProducts =
    homeData?.newArrivals && homeData.newArrivals.length > 0
      ? homeData.newArrivals
      : homeData?.products ?? [];
  const newArrivals = sourceProducts.slice(0, 6).map(mapProduct);

  useIsomorphicLayoutEffect(() => {
    ensureScrollTrigger();
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      const cards = gsap.utils.toArray<HTMLElement>(
        gridRef.current?.querySelectorAll('.product-card') ?? []
      );
      if (cards.length) {
        ScrollTrigger.batch(cards, {
          start: 'top 85%',
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { y: 28, opacity: 0, scale: 0.98 },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.6,
                ease: 'power2.out',
                stagger: 0.1,
                overwrite: 'auto',
              }
            ),
        });
      }
    }, section);

    return () => ctx.revert();
  }, [newArrivals.length]);

  return (
    <section
      ref={sectionRef}
      id="new-arrivals"
      className="relative bg-[#F6F2EE] py-20 lg:py-28"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Title Row */}
        <div ref={titleRef} className="flex items-center justify-between mb-12">
          <h2 className="headline-lg text-xl md:text-1xl lg:text-4xl text-[#111]">
            New Arrivals
          </h2>
          <a
            href="#products"
            className="label-text text-[#6E6E6E] hover:text-[#D4A05A] transition-colors"
          >
            View all
          </a>
        </div>

        {/* Product Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {newArrivals.map((product) => (
            <div
              key={product.id}
              className="product-card group rounded-xl border border-[#111]/10 bg-white/60 shadow-sm transition-shadow hover:shadow-lg p-4"
            >
              {/* Image */}
              <div 
                className="relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-100 mb-4 cursor-pointer"
                onClick={() => navigate(`/product/${product.slug ?? product.id}`)}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image w-full h-full object-cover"
                />
                {/* Quick Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, 'Unstitched');
                  }}
                  className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 hover:bg-[#D4A05A] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                  aria-label="Quick add"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Info */}
              <div className="space-y-1">
                <button 
                  onClick={() => navigate(`/product/${product.slug ?? product.id}`)}
                  className="font-medium text-sm text-[#111] hover:text-[#D4A05A] transition-colors text-left"
                >
                  {product.name}
                </button>
                <p className="text-sm text-[#6E6E6E]">{formatPrice(product.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
