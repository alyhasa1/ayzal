import { useRef, useMemo } from 'react';
import { useNavigate } from '@remix-run/react';
import gsap from 'gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { ensureScrollTrigger } from '@/lib/gsap';

const fallbackCategories = [
  {
    name: 'Formals',
    image: 'https://empress-clothing.com/cdn/shop/collections/CS07-Crimson-Summer_in_the_Meadows_-_D1A-2.jpg',
  },
  {
    name: 'Ready-to-Wear',
    image: 'https://www.libas.in/cdn/shop/files/27190.jpg?v=1739181064',
  },
  {
    name: 'Bridal',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7TM1Qo1YfKZr8kX5CAM89NdsYL9JI_-CjFw&s',
  },
];

export default function CategorySection({ data }: { data?: any }) {
  const sectionRef = useRef<HTMLElement>(null);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const labelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const navigate = useNavigate();
  const homeData = data?.homeData;

  const categories = useMemo(() => {
    const mapped = homeData?.categories?.map((category: any) => ({
      name: category.name,
      image: category.image_url,
      slug: category.slug,
    })) ?? [];
    return mapped.length >= 3 ? mapped.slice(0, 3) : fallbackCategories;
  }, [homeData?.categories]);

  useIsomorphicLayoutEffect(() => {
    ensureScrollTrigger();
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const panels = panelsRef.current.filter(Boolean) as HTMLDivElement[];
      const labels = labelsRef.current.filter(Boolean) as HTMLDivElement[];

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      scrollTl.fromTo(
        panels,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12, immediateRender: false },
        0
      );

      scrollTl.fromTo(
        labels,
        { y: 12, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out', stagger: 0.1, immediateRender: false },
        0.12
      );

      return () => scrollTl.kill();
    }, section);

    return () => ctx.revert();
  }, [categories]);

  return (
    <section ref={sectionRef} id="categories" className="section-pinned">
      {/* Background */}
      <div className="absolute inset-0 bg-[#F6F2EE] z-[1]" />

      {/* Panels */}
      <div className="relative z-[5] flex flex-col gap-4 px-6 py-8 md:absolute md:inset-0 md:flex-row md:gap-0 md:px-0 md:py-0">
        {categories.map((category, index) => (
          <div
            key={category.name}
            ref={(el) => { panelsRef.current[index] = el; }}
            className={`category-panel relative overflow-hidden w-full h-[32vh] rounded-xl shadow-lg md:h-full md:flex-1 md:rounded-none md:shadow-none ${
              index === 0 ? 'md:w-[34vw]' : index === 1 ? 'md:w-[34vw]' : 'md:w-[32vw]'
            }`}
          >
            {/* Background Image */}
            <img
              src={category.image}
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Content */}
            <div
              ref={(el) => { labelsRef.current[index] = el; }}
              className="absolute inset-0 z-[3] flex flex-col items-center justify-center text-white"
            >
              <h3 className="panel-label headline-lg text-xl md:text-1xl lg:text-4xl mb-4 text-center">
                {category.name}
              </h3>
              <button
                className="btn-ghost"
                onClick={() => {
                  if (category.slug) {
                    navigate(`/category/${category.slug}`);
                  }
                }}
              >
                Explore
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
