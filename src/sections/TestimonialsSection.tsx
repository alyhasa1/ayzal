import { useRef, useMemo } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote } from 'lucide-react';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { ensureScrollTrigger } from '@/lib/gsap';

export default function TestimonialsSection({ data }: { data?: any }) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pressRef = useRef<HTMLDivElement>(null);
  const homeData = data?.homeData;

  const testimonials = useMemo(
    () => (homeData?.testimonials ?? []).filter((item: any) => item.enabled !== false),
    [homeData?.testimonials]
  );
  const pressQuotes = useMemo(
    () => (homeData?.pressQuotes ?? []).filter((item: any) => item.enabled !== false),
    [homeData?.pressQuotes]
  );

  useIsomorphicLayoutEffect(() => {
    if (!ensureScrollTrigger()) return;
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

      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      if (cards.length) {
        ScrollTrigger.batch(cards, {
          start: 'top 85%',
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { y: 28, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: 'power2.out',
                stagger: 0.1,
                overwrite: 'auto',
              }
            ),
        });
      }

      gsap.fromTo(
        pressRef.current,
        { y: 18, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: pressRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, [testimonials.length, pressQuotes.length]);

  return (
    <section ref={sectionRef} className="relative bg-[#F6F2EE] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Title */}
        <h2
          ref={titleRef}
          className="headline-lg text-xl md:text-1xl lg:text-4xl text-[#111] mb-12"
        >
          Loved by Many
        </h2>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Testimonials */}
          <div className="space-y-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial._id}
                ref={(el) => { cardsRef.current[index] = el; }}
                className="p-6 border border-[#111]/8 bg-white/50"
              >
                <Quote className="w-6 h-6 text-[#D4A05A] mb-4" strokeWidth={1.5} />
                <p className="font-body text-[#111] mb-4">{testimonial.text}</p>
                <p className="label-text text-[#6E6E6E]">? {testimonial.author}</p>
              </div>
            ))}
          </div>

          {/* Press Quotes */}
          <div ref={pressRef} className="space-y-8">
            <p className="label-text text-[#6E6E6E] mb-6">Press</p>
            {pressQuotes.map((quote) => (
              <div key={quote._id} className="border-l-2 border-[#D4A05A] pl-6">
                <p className="font-body text-lg text-[#111] mb-2">"{quote.text}"</p>
                <p className="text-sm text-[#6E6E6E]">? {quote.source}</p>
              </div>
            ))}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#111]/8">
              <div>
                <p className="font-display text-1xl font-bold text-[#D4A05A]">10K+</p>
                <p className="label-text text-[#6E6E6E] mt-1">Happy Customers</p>
              </div>
              <div>
                <p className="font-display text-1xl font-bold text-[#D4A05A]">500+</p>
                <p className="label-text text-[#6E6E6E] mt-1">Designs</p>
              </div>
              <div>
                <p className="font-display text-1xl font-bold text-[#D4A05A]">50+</p>
                <p className="label-text text-[#6E6E6E] mt-1">Artisans</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
