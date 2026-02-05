import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import FormField, { fieldTextareaClass } from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';
import { ChevronUp, ChevronDown } from 'lucide-react';

function validateJson(str: string): string | null {
  try {
    JSON.parse(str);
    return null;
  } catch (err: any) {
    const msg = err?.message ?? 'Invalid JSON';
    const match = msg.match(/position (\d+)/);
    if (match) {
      const pos = Number(match[1]);
      const line = str.substring(0, pos).split('\n').length;
      return `${msg} (around line ${line})`;
    }
    return msg;
  }
}

export default function AdminSections() {
  const sectionsRaw = useQuery(api.siteSections.list) ?? [];
  const updateSection = useMutation(api.siteSections.update);
  const { toast } = useToast();

  const sections = useMemo(
    () => [...sectionsRaw].sort((a, b) => a.sort_order - b.sort_order),
    [sectionsRaw]
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const getDraft = (section: any) =>
    drafts[section._id] ?? JSON.stringify(section.data ?? {}, null, 2);

  const getJsonError = (sectionId: string) => {
    const draft = drafts[sectionId];
    if (!draft) return null;
    return validateJson(draft);
  };

  const handleSave = async (sectionId: string) => {
    const draft = getDraft(sections.find((s) => s._id === sectionId)!);
    const err = validateJson(draft);
    if (err) {
      toast(err, 'error');
      return;
    }
    setSavingId(sectionId);
    try {
      const parsed = JSON.parse(draft);
      await updateSection({ id: sectionId as any, data: parsed });
      toast('Section saved');
      setDrafts((prev) => {
        const n = { ...prev };
        delete n[sectionId];
        return n;
      });
    } catch (e: any) {
      toast(e?.message ?? 'Failed to save', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    const target = sections[index];
    const swapWith = sections[index + direction];
    if (!target || !swapWith) return;
    try {
      await updateSection({ id: target._id, sort_order: swapWith.sort_order });
      await updateSection({ id: swapWith._id, sort_order: target.sort_order });
      toast('Reordered');
    } catch (e: any) {
      toast(e?.message ?? 'Failed to reorder', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl">Site Sections</h2>
      {sections.map((section, index) => {
        const jsonErr = getJsonError(section._id);
        const isDirty = !!drafts[section._id];
        const isSaving = savingId === section._id;
        return (
          <div key={section._id} className="p-4 bg-white border border-[#111]/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm uppercase tracking-widest">{section.key}</p>
                <p className="text-xs text-[#6E6E6E]">Position: {index + 1}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 border border-[#111]/10 hover:border-[#D4A05A] transition-colors disabled:opacity-30"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1.5 border border-[#111]/10 hover:border-[#D4A05A] transition-colors disabled:opacity-30"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <label className="text-xs uppercase tracking-widest flex items-center gap-2 ml-2">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(e) => updateSection({ id: section._id, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
              </div>
            </div>
            <FormField label="Section Data (JSON)" error={jsonErr ?? undefined}>
              <textarea
                value={getDraft(section)}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [section._id]: e.target.value }))}
                className={`${fieldTextareaClass} min-h-32 font-mono text-xs ${
                  jsonErr ? 'border-red-300 focus:border-red-400' : ''
                }`}
              />
            </FormField>
            {isDirty && (
              <button
                className="btn-primary text-xs"
                onClick={() => handleSave(section._id)}
                disabled={isSaving || !!jsonErr}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
