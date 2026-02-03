import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminSections() {
  const sectionsRaw = useQuery(api.siteSections.list) ?? [];
  const updateSection = useMutation(api.siteSections.update);

  const sections = useMemo(
    () => [...sectionsRaw].sort((a, b) => a.sort_order - b.sort_order),
    [sectionsRaw]
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async (sectionId: string) => {
    const draft = drafts[sectionId];
    try {
      const parsed = draft ? JSON.parse(draft) : {};
      await updateSection({ id: sectionId as any, data: parsed });
      setErrors((prev) => ({ ...prev, [sectionId]: '' }));
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, [sectionId]: err?.message ?? 'Invalid JSON' }));
    }
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    const target = sections[index];
    const swapWith = sections[index + direction];
    if (!target || !swapWith) return;
    await updateSection({ id: target._id, sort_order: swapWith.sort_order });
    await updateSection({ id: swapWith._id, sort_order: target.sort_order });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl">Site Sections</h2>
      {sections.map((section, index) => (
        <div key={section._id} className="p-4 bg-white border border-[#111]/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm uppercase tracking-widest">{section.key}</p>
              <p className="text-xs text-[#6E6E6E]">Order: {index + 1}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 text-xs border border-[#111]/10"
                onClick={() => moveSection(index, -1)}
                disabled={index === 0}
              >
                Up
              </button>
              <button
                className="px-3 py-1 text-xs border border-[#111]/10"
                onClick={() => moveSection(index, 1)}
                disabled={index === sections.length - 1}
              >
                Down
              </button>
              <label className="text-xs uppercase tracking-widest flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(e) => updateSection({ id: section._id, enabled: e.target.checked })}
                />
                Enabled
              </label>
            </div>
          </div>
          <textarea
            value={drafts[section._id] ?? JSON.stringify(section.data ?? {}, null, 2)}
            onChange={(e) => setDrafts((prev) => ({ ...prev, [section._id]: e.target.value }))}
            className="w-full border border-[#111]/10 px-3 py-2 text-xs min-h-32 font-mono"
          />
          {errors[section._id] && (
            <p className="text-xs text-red-500">{errors[section._id]}</p>
          )}
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => handleSave(section._id)}>
              Save JSON
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
