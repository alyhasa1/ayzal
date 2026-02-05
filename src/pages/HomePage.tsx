import { Fragment, useMemo } from 'react';
import { defaultSectionOrder, sectionRegistry } from '@/sections/sectionRegistry';

type HomeSection = {
  key: string;
  enabled: boolean;
  sort_order: number;
  data: any;
};

export type HomeData = {
  sections: HomeSection[];
  products: any[];
  newArrivals: any[];
  spotlight: any | null;
  categories: any[];
  testimonials: any[];
  pressQuotes: any[];
  settings: any;
};

export default function HomePage({ homeData }: { homeData: HomeData }) {
  const sections = homeData.sections;
  const orderedSections = useMemo(() => {
    if (!sections || sections.length === 0) {
      return defaultSectionOrder.map((key, index) => ({
        key,
        enabled: true,
        sort_order: index,
        data: {},
      }));
    }
    return sections
      .filter((section) => section.enabled)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [sections]);
  const hasFooter = orderedSections.some((section) => section.key === 'footer');

  return (
    <>
      {orderedSections.map((section) => {
        const Component = sectionRegistry[section.key];
        if (!Component) return null;
        if (section.key === 'footer') {
          return (
            <Fragment key={section.key}>
              <section className="bg-[#F6F2EE] px-6 lg:px-12 pb-10">
                <div className="max-w-4xl mx-auto text-sm text-[#6E6E6E] leading-relaxed">
                  Discover Ayzal Collections for pakistani dresses and buy pakistani dresses in
                  lahore with premium lawn, unstitched lawn, and designer lawn pakistan styles
                  crafted for timeless elegance.
                </div>
              </section>
              <Component data={{ ...section.data, homeData }} />
            </Fragment>
          );
        }
        return <Component key={section.key} data={{ ...section.data, homeData }} />;
      })}
      {!hasFooter && (
        <section className="bg-[#F6F2EE] px-6 lg:px-12 pb-10">
          <div className="max-w-4xl mx-auto text-sm text-[#6E6E6E] leading-relaxed">
            Discover Ayzal Collections for pakistani dresses and buy pakistani dresses in lahore
            with premium lawn, unstitched lawn, and designer lawn pakistan styles crafted for
            timeless elegance.
          </div>
        </section>
      )}
    </>
  );
}
