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
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', immediateRender: false },
        0.05
      );

      scrollTl.fromTo(
        tipRef.current,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false },
        0.12
      );

      return () => scrollTl.kill();
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="section-pinned">
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
