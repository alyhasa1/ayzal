import { useRef } from 'react';
import { useNavigate } from '@remix-run/react';
import gsap from 'gsap';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/format';
import { mapProduct } from '@/lib/mappers';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { ensureScrollTrigger } from '@/lib/gsap';

export default function SpotlightSection({ data }: { data?: any }) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const priceRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const homeData = data?.homeData;
  const spotlightProduct = homeData?.spotlight ? mapProduct(homeData.spotlight) : null;

  useIsomorphicLayoutEffect(() => {
    if (!ensureScrollTrigger()) return;
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1.06, opacity: 0.75 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'power2.out', immediateRender: false },
        0
      );

      scrollTl.fromTo(
        headlineRef.current,
        { y: 22, opacity: 0, rotateX: 12 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: 'power2.out', immediateRender: false },
        0.05
      );

      scrollTl.fromTo(
        priceRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false },
        0.12
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 10, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out', immediateRender: false },
        0.18
      );

      return () => scrollTl.kill();
    }, section);

    return () => ctx.revert();
  }, []);

  const handleAddToCart = () => {
    if (!spotlightProduct) return;
    addToCart(spotlightProduct, 'Unstitched');
  };

  if (!spotlightProduct) {
    return null;
  }

  return (
    <section ref={sectionRef} className="section-pinned z-40">
      {/* Background Image */}
      <div ref={bgRef} className="absolute inset-0 z-[1]">
        <img
          src={spotlightProduct.image}
          alt={spotlightProduct.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          sizes="100vw"
        />
      </div>

      {/* Vignette Overlay */}
      <div className="vignette-overlay z-[2]" />

      {/* Content */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-white px-6">
        <h2
          ref={headlineRef}
          className="headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center mb-4"
          style={{ perspective: '1000px' }}
        >
          {spotlightProduct.name}
        </h2>
        <p
          ref={priceRef}
          className="font-display text-xl md:text-xl text-white/90 mb-8"
        >
          {formatPrice(spotlightProduct.price)}
        </p>

        <div ref={ctaRef} className="flex flex-col items-center gap-4">
          <button onClick={handleAddToCart} className="btn-primary">
            Add to Bag
          </button>
          <button
            onClick={() => navigate(`/product/${spotlightProduct.slug ?? spotlightProduct.id}`)}
            className="text-sm text-white/70 hover:text-white underline underline-offset-4 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </section>
  );
}
