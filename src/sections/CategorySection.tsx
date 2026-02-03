import { useRef, useLayoutEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  void data;
  const sectionRef = useRef<HTMLElement>(null);
  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const labelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const categoriesRaw = useQuery(api.categories.list);

  const categories = useMemo(() => {
    const mapped = categoriesRaw?.map((category) => ({
      name: category.name,
      image: category.image_url,
    })) ?? [];
    return mapped.length >= 3 ? mapped.slice(0, 3) : fallbackCategories;
  }, [categoriesRaw]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=150%',
          pin: true,
          scrub: 0.6,
        },
      });

      // ENTRANCE (0-30%)
      // Left panel
      scrollTl.fromTo(
        panelsRef.current[0],
        { x: '-40vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0
      );

      // Center panel
      scrollTl.fromTo(
        panelsRef.current[1],
        { y: '20vh', opacity: 0 },
        { y: 0, opacity: 1, ease: 'power2.out' },
        0.06
      );

      // Right panel
      scrollTl.fromTo(
        panelsRef.current[2],
        { x: '40vw', opacity: 0 },
        { x: 0, opacity: 1, ease: 'power2.out' },
        0.1
      );

      // Labels
      labelsRef.current.forEach((label, i) => {
        scrollTl.fromTo(
          label,
          { scale: 0.96, opacity: 0 },
          { scale: 1, opacity: 1, ease: 'power2.out' },
          0.16 + i * 0.04
        );
      });

      // SETTLE (30-70%): Hold

      // EXIT (70-100%)
      scrollTl.fromTo(
        panelsRef.current[0],
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        panelsRef.current[1],
        { y: 0, opacity: 1 },
        { y: '-12vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        panelsRef.current[2],
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, [categories]);

  return (
    <section ref={sectionRef} id="categories" className="section-pinned z-[70]">
      {/* Background */}
      <div className="absolute inset-0 bg-[#F6F2EE] z-[1]" />

      {/* Panels */}
      <div className="absolute inset-0 z-[5] flex">
        {categories.map((category, index) => (
          <div
            key={category.name}
            ref={(el) => { panelsRef.current[index] = el; }}
            className={`category-panel flex-1 h-full relative ${
              index === 0 ? 'w-[34vw]' : index === 1 ? 'w-[34vw]' : 'w-[32vw]'
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
              <h3 className="panel-label headline-lg text-2xl md:text-3xl lg:text-4xl mb-4 text-center">
                {category.name}
              </h3>
              <button className="btn-ghost">Explore</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
