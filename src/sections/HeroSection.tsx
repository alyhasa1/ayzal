import { useEffect, useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type HeroData = {
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  imageUrl?: string;
  scrollHintLabel?: string;
};

const defaultHeroData: Required<HeroData> = {
  headline: 'AYZAL',
  subheadline: 'Elegance in Every Thread',
  ctaLabel: 'Explore the Collection',
  imageUrl: 'https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg',
  scrollHintLabel: 'Scroll',
};

export default function HeroSection({ data }: { data?: HeroData }) {
  const content = { ...defaultHeroData, ...(data ?? {}) };
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Auto-play entrance animation on load
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Background fade in
      tl.fromTo(
        bgRef.current,
        { scale: 1.08 },
        { scale: 1, duration: 1.1 }
      );

      // Headline words animation
      const words = headlineRef.current?.querySelectorAll('.word');
      if (words) {
        tl.fromTo(
          words,
          { opacity: 0, y: 24, rotateX: 18 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.9, stagger: 0.06 },
          '-=0.6'
        );
      }

      // Subheadline
      tl.fromTo(
        subheadlineRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7 },
        '-=0.5'
      );

      // CTA
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.6 },
        '-=0.4'
      );

      // Scroll hint
      tl.fromTo(
        scrollHintRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5 },
        '-=0.2'
      );

      return () => tl.kill();
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Scroll-driven exit animation
  useLayoutEffect(() => {
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
        { scale: 1.05, opacity: 0.85 },
        { scale: 1, opacity: 1, duration: 0.9, ease: 'power2.out', immediateRender: false },
        0
      );

      scrollTl.fromTo(
        headlineRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', immediateRender: false },
        0.05
      );

      scrollTl.fromTo(
        subheadlineRef.current,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false },
        0.12
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 12, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out', immediateRender: false },
        0.18
      );

      scrollTl.fromTo(
        scrollHintRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', immediateRender: false },
        0.24
      );

      return () => scrollTl.kill();
    }, section);

    return () => ctx.revert();
  }, []);

  const scrollToProducts = () => {
    const element = document.getElementById('new-arrivals');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const letters = content.headline.split('');

  return (
    <section ref={sectionRef} className="section-pinned bg-[#0B0F17]">
      {/* Background Image */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-[1] transition-opacity duration-700 ease-out"
        style={{ opacity: imageLoaded ? 1 : 0 }}
      >
        <img
          src={content.imageUrl}
          alt={`${content.headline} Hero`}
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
        />
      </div>

      {/* Vignette Overlay */}
      <div className="vignette-overlay z-[2]" />

      {/* Content */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-white">
        {/* Headline */}
        <div
          ref={headlineRef}
          className="text-center mb-4"
          style={{ perspective: '1000px' }}
        >
          <h1 className="headline-xl text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            {letters.map((letter, idx) => (
              <span key={`${letter}-${idx}`} className="word inline-block">
                {letter}
              </span>
            ))}
          </h1>
        </div>

        {/* Subheadline */}
        <p
          ref={subheadlineRef}
          className="font-body text-sm md:text-base tracking-[0.2em] uppercase text-white/90 mb-10"
        >
          {content.subheadline}
        </p>

        {/* CTA */}
        <button ref={ctaRef} onClick={scrollToProducts} className="btn-primary">
          {content.ctaLabel}
        </button>
      </div>

      {/* Scroll Hint */}
      <div
        ref={scrollHintRef}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[5] flex flex-col items-center text-white/70"
      >
        <div className="w-px h-10 bg-white/40 mb-2" />
        <span className="label-text">{content.scrollHintLabel}</span>
      </div>
    </section>
  );
}
