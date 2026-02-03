import { useRef, useLayoutEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

type MembershipData = {
  headline?: string;
  subheadline?: string;
  imageUrl?: string;
};

const defaultMembershipData: Required<MembershipData> = {
  headline: 'Join Ayzal',
  subheadline: 'Early access + exclusive edits.',
  imageUrl: 'https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064',
};

export default function MembershipSection({ data }: { data?: MembershipData }) {
  const content = { ...defaultMembershipData, ...(data ?? {}) };
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      scrollTl.fromTo(
        headlineRef.current,
        { x: '-14vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      scrollTl.fromTo(
        subheadlineRef.current,
        { x: '14vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.1
      );

      scrollTl.fromTo(
        ctaRef.current,
        { scale: 0.94, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'power2.out' },
        0.16
      );

      scrollTl.fromTo(
        bgRef.current,
        { scale: 1.06, opacity: 0.7 },
        { scale: 1, opacity: 1, ease: 'power2.out' },
        0
      );

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        [headlineRef.current, subheadlineRef.current, ctaRef.current],
        { opacity: 1 },
        { opacity: 0, ease: 'power2.in', stagger: 0.02 },
        0.7
      );

      scrollTl.fromTo(
        bgRef.current,
        { opacity: 1 },
        { opacity: 0.4, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section ref={sectionRef} className="section-pinned z-[110]">
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
          className="headline-xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4"
        >
          {content.headline}
        </h2>
        <p
          ref={subheadlineRef}
          className="font-body text-base md:text-lg text-white/90 mb-10"
        >
          {content.subheadline}
        </p>

        <div ref={ctaRef} className="w-full max-w-md">
          {isSubscribed ? (
            <div className="flex items-center justify-center gap-2 text-[#D4A05A]">
              <Check className="w-5 h-5" />
              <span className="font-medium">Thank you for subscribing!</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/30 text-white placeholder:text-white/50 focus:outline-none focus:border-[#D4A05A]"
                required
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
