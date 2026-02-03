import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type SignatureData = {
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  imageUrl?: string;
};

const defaultSignatureData: Required<SignatureData> = {
  headline: 'Signature Series',
  subheadline: 'Crafted for the moments that matter.',
  ctaLabel: 'Shop Signature',
  imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s',
};

export default function SignatureSection({ data }: { data?: SignatureData }) {
  const content = { ...defaultSignatureData, ...(data ?? {}) };
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl.fromTo(
        headlineRef.current,
        { x: '-18vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(
        subheadlineRef.current,
        { x: '18vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.08
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: '10vh', opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, ease: 'power2.out' },
        0.14
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1.07, opacity: 0.7 },
        { scale: 1, opacity: 1, ease: 'power2.out' },
        0
      );

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        headlineRef.current,
        { y: 0, opacity: 1 },
        { y: '-14vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        subheadlineRef.current,
        { y: 0, opacity: 1 },
        { y: '-10vh', opacity: 0, ease: 'power2.in' },
        0.72
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 0, opacity: 1 },
        { y: '10vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1, opacity: 1 },
        { scale: 1.05, opacity: 0.35, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const scrollToProducts = () => {
    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={sectionRef} className="section-pinned z-30">
      {/* Background Image */}
      <div ref={bgRef} className="absolute inset-0 z-[1]">
        <img
          src={content.imageUrl}
          alt={content.headline}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vignette Overlay */}
      <div className="vignette-overlay z-[2]" />

      {/* Content */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-white px-6">
        <h2
          ref={headlineRef}
          className="headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center mb-6"
        >
          {content.headline}
        </h2>
        <p
          ref={subheadlineRef}
          className="font-body text-base md:text-lg text-white/90 text-center max-w-xl mb-10"
        >
          {content.subheadline}
        </p>
        <button ref={ctaRef} onClick={scrollToProducts} className="btn-primary">
          {content.ctaLabel}
        </button>
      </div>
    </section>
  );
}
