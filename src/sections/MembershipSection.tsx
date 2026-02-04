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
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', immediateRender: false },
        0.06
      );

      scrollTl.fromTo(
        subheadlineRef.current,
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', immediateRender: false },
        0.12
      );

      scrollTl.fromTo(
        ctaRef.current,
        { y: 12, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power2.out', immediateRender: false },
        0.18
      );

      return () => scrollTl.kill();
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
