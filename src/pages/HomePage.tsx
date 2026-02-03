import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { defaultSectionOrder, sectionRegistry } from '@/sections/sectionRegistry';

export default function HomePage() {
  const sections = useQuery(api.siteSections.list);
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

  return (
    <>
      {orderedSections.map((section) => {
        const Component = sectionRegistry[section.key];
        if (!Component) return null;
        return <Component key={section.key} data={section.data} />;
      })}
    </>
  );
}
