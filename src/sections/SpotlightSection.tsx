import { useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/format';
import { mapProduct } from '@/lib/mappers';

gsap.registerPlugin(ScrollTrigger);

export default function SpotlightSection({ data }: { data?: any }) {
  void data;
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const priceRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const spotlightRaw = useQuery(api.products.getSpotlight);
  const spotlightProduct = spotlightRaw ? mapProduct(spotlightRaw) : null;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl.fromTo(
        headlineRef.current,
        { y: '20vh', opacity: 0, rotateX: 20 },
        { y: 0, opacity: 1, rotateX: 0, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(
        priceRef.current,
        { y: '10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.1
      );

      scrollTl.fromTo(
        ctaRef.current,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'power2.out' },
        0.16
      );

      scrollTl.fromTo(
        bgRef.current,
        { x: '6vw', scale: 1.06, opacity: 0.7 },
        { x: 0, scale: 1, opacity: 1, ease: 'power2.out' },
        0
      );

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        headlineRef.current,
        { x: 0, opacity: 1 },
        { x: '-10vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        priceRef.current,
        { x: 0, opacity: 1 },
        { x: '10vw', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 0, opacity: 1 },
        { y: '12vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1, opacity: 1 },
        { scale: 1.06, opacity: 0.35, ease: 'power2.in' },
        0.7
      );
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
          className="font-display text-xl md:text-2xl text-white/90 mb-8"
        >
          {formatPrice(spotlightProduct.price)}
        </p>

        <div ref={ctaRef} className="flex flex-col items-center gap-4">
          <button onClick={handleAddToCart} className="btn-primary">
            Add to Bag
          </button>
          <button
            onClick={() => navigate(`/product/${spotlightProduct.id}`)}
            className="text-sm text-white/70 hover:text-white underline underline-offset-4 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </section>
  );
}
