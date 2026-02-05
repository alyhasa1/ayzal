import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import FormField, { fieldInputClass, fieldTextareaClass } from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';

type Draft = { label: string; instructions: string; active: boolean };

export default function AdminPayments() {
  const methods = useQuery(api.paymentMethods.list) ?? [];
  const updateMethod = useMutation(api.paymentMethods.update);
  const createMethod = useMutation(api.paymentMethods.create);
  const { toast } = useToast();

  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const getDraft = (method: any): Draft =>
    drafts[method._id] ?? {
      label: method.label,
      instructions: method.instructions ?? '',
      active: method.active,
    };

  const setDraft = (id: string, partial: Partial<Draft>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...getDraftById(id, prev), ...partial },
    }));
  };

  const getDraftById = (id: string, current: Record<string, Draft>): Draft => {
    if (current[id]) return current[id];
    const method = methods.find((m) => m._id === id);
    return {
      label: method?.label ?? '',
      instructions: method?.instructions ?? '',
      active: method?.active ?? true,
    };
  };

  const handleSave = async (id: string) => {
    const draft = getDraft(methods.find((m) => m._id === id)!);
    setSavingId(id);
    try {
      await updateMethod({
        id: id as any,
        label: draft.label,
        instructions: draft.instructions,
        active: draft.active,
      });
      toast('Payment method updated');
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err: any) {
      toast(err?.message ?? 'Failed to save', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const isDirty = (method: any): boolean => {
    const draft = drafts[method._id];
    if (!draft) return false;
    return (
      draft.label !== method.label ||
      draft.instructions !== (method.instructions ?? '') ||
      draft.active !== method.active
    );
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      await createMethod({ key, label, instructions, active, sort_order: Date.now() });
      toast('Payment method created');
      setKey('');
      setLabel('');
      setInstructions('');
      setActive(true);
    } catch (err: any) {
      toast(err?.message ?? 'Failed to create', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.6fr] gap-8">
      <div className="space-y-4">
        <h2 className="font-display text-xl">Payment Methods</h2>
        {methods.map((method) => {
          const draft = getDraft(method);
          const dirty = isDirty(method);
          const isSaving = savingId === method._id;
          return (
            <div key={method._id} className="p-4 bg-white border border-[#111]/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{method.label}</p>
                  <p className="text-xs text-[#6E6E6E]">Key: {method.key}</p>
                </div>
                <label className="text-xs uppercase tracking-widest flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft(method._id, { active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <FormField label="Display Label">
                <input
                  value={draft.label}
                  onChange={(e) => setDraft(method._id, { label: e.target.value })}
                  className={fieldInputClass}
                />
              </FormField>
              <FormField label="Instructions" hint="Shown to customer at checkout">
                <textarea
                  value={draft.instructions}
                  onChange={(e) => setDraft(method._id, { instructions: e.target.value })}
                  className={`${fieldTextareaClass} min-h-20`}
                />
              </FormField>
              {dirty && (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={isSaving}
                  onClick={() => handleSave(method._id)}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white/80 border border-[#111]/10 p-6">
        <h3 className="font-display text-lg mb-4">Add Payment Method</h3>
        <form onSubmit={handleCreate} className="space-y-4 text-sm">
          <FormField label="Key" required hint="Internal identifier, e.g. bank_transfer">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className={fieldInputClass}
              required
            />
          </FormField>
          <FormField label="Display Label" required>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={fieldInputClass}
              required
            />
          </FormField>
          <FormField label="Instructions" hint="Shown to customer at checkout">
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={`${fieldTextareaClass} min-h-20`}
            />
          </FormField>
          <label className="text-xs uppercase tracking-widest flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <button className="btn-primary w-full" type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  );
}
