import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type StoryData = {
  headline?: string;
  body?: string;
  imageUrl?: string;
};

const defaultStoryData: Required<StoryData> = {
  headline: 'Made by Hand',
  body: 'Every piece is cut, stitched, and finished by artisans in Lahore.',
  imageUrl: 'https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064',
};

export default function StorySection({ data }: { data?: StoryData }) {
  const content = { ...defaultStoryData, ...(data ?? {}) };
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);

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
        { scale: 0.96, opacity: 0, y: '10vh' },
        { scale: 1, opacity: 1, y: 0, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(
        bodyRef.current,
        { y: '6vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.14
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1.08, opacity: 0.6 },
        { scale: 1, opacity: 1, ease: 'power2.out' },
        0
      );

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        headlineRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        bodyRef.current,
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in' },
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
    <section ref={sectionRef} id="story" className="section-pinned z-[60]">
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
      <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center text-white px-6 text-center">
        <h2
          ref={headlineRef}
          className="headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6"
        >
          {content.headline}
        </h2>
        <p
          ref={bodyRef}
          className="font-body text-base md:text-lg text-white/90 max-w-2xl"
        >
          {content.body}
        </p>
      </div>
    </section>
  );
}
