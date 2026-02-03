import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type StyleTipData = {
  headline?: string;
  tip?: string;
  imageUrl?: string;
};

const defaultStyleTipData: Required<StyleTipData> = {
  headline: 'Style Tip',
  tip: 'Pair soft neutrals with one bold accent.',
  imageUrl:
    'https://s.alicdn.com/@sc04/kf/Ac711b050d02d4004a58afedbfd7a2412b/Premium-Quality-Indian-Pakistani-Ladies-Stitched-Shalwar-Kameez-Suits-Wholesale-Women-Silk-Dress.jpg',
};

export default function StyleTipSection({ data }: { data?: StyleTipData }) {
  const content = { ...defaultStyleTipData, ...(data ?? {}) };
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const tipRef = useRef<HTMLParagraphElement>(null);

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
        { y: '16vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(
        tipRef.current,
        { y: '10vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.12
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
        { x: 0, opacity: 1 },
        { x: '-8vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        tipRef.current,
        { x: 0, opacity: 1 },
        { x: '8vw', opacity: 0, ease: 'power2.in' },
        0.72
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

  return (
    <section ref={sectionRef} className="section-pinned z-[80]">
      {/* Background Image */}
      <div ref={bgRef} className="absolute inset-0 z-[1]">
        <img
          src={content.imageUrl}
          alt={content.headline}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vignette Overlay */}
      <div className="vignette-overlay-light z-[2]" />

      {/* Content */}
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-white px-6 text-center">
        <h2
          ref={headlineRef}
          className="headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6"
        >
          {content.headline}
        </h2>
        <p
          ref={tipRef}
          className="font-body text-lg md:text-xl text-white/90 max-w-xl"
        >
          {content.tip}
        </p>
      </div>
    </section>
  );
}
