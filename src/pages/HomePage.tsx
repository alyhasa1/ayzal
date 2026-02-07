import { Fragment, useMemo } from 'react';
import { defaultSectionOrder, sectionRegistry } from '@/sections/sectionRegistry';
import DiscoveryRail from '@/components/shop/DiscoveryRail';

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
  discovery?: {
    trendingNow: any[];
    topRated: any[];
    justDropped: any[];
    budgetPicks: any[];
    inStockNow: any[];
  };
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
  const contentSections = orderedSections.filter((section) => section.key !== 'footer');
  const footerSection = orderedSections.find((section) => section.key === 'footer');
  const FooterComponent = footerSection ? sectionRegistry[footerSection.key] : null;

  return (
    <>
      {contentSections.map((section) => {
        const Component = sectionRegistry[section.key];
        if (!Component) return null;
        return <Component key={section.key} data={{ ...section.data, homeData }} />;
      })}

      {homeData.discovery ? (
        <section className="bg-[#F6F2EE] px-6 py-16 lg:px-12">
          <div className="shop-shell space-y-5">
            <DiscoveryRail
              title="Trending Right Now"
              subtitle="Best sellers currently chosen by shoppers."
              items={homeData.discovery.trendingNow ?? []}
              microcopy="High conversion products this week."
            />
            <DiscoveryRail
              title="Top Rated Picks"
              subtitle="Verified review favorites worth shortlisting."
              items={homeData.discovery.topRated ?? []}
              microcopy="Rated highly for quality and finishing."
            />
            <DiscoveryRail
              title="New Drops"
              subtitle="Fresh arrivals curated for this season."
              items={homeData.discovery.justDropped ?? []}
              microcopy="Recently added."
            />
            <DiscoveryRail
              title="Value Picks"
              subtitle="Popular styles under PKR 7,999."
              items={homeData.discovery.budgetPicks ?? []}
              microcopy="Smart-value choices."
            />
          </div>
        </section>
      ) : null}

      <section className="bg-[#F6F2EE] px-6 lg:px-12 pb-10">
        <div className="max-w-4xl mx-auto text-sm text-[#6E6E6E] leading-relaxed">
          Discover Ayzal Collections for pakistani dresses and buy pakistani dresses in lahore
          with premium lawn, unstitched lawn, and designer lawn pakistan styles crafted for
          timeless elegance.
        </div>
      </section>

      {footerSection && FooterComponent ? (
        <Fragment key={footerSection.key}>
          <FooterComponent data={{ ...footerSection.data, homeData }} />
        </Fragment>
      ) : null}
    </>
  );
}
