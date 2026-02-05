import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import FormField, { fieldInputClass, fieldTextareaClass } from '@/components/admin/FormField';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

type TestimonialDraft = { text: string; author: string; enabled: boolean };
type PressDraft = { text: string; source: string; enabled: boolean };

export default function AdminTestimonials() {
  const testimonials = useQuery(api.testimonials.list) ?? [];
  const pressQuotes = useQuery(api.pressQuotes.list) ?? [];
  const createTestimonial = useMutation(api.testimonials.create);
  const updateTestimonial = useMutation(api.testimonials.update);
  const removeTestimonial = useMutation(api.testimonials.remove);
  const createPress = useMutation(api.pressQuotes.create);
  const updatePress = useMutation(api.pressQuotes.update);
  const removePress = useMutation(api.pressQuotes.remove);
  const { toast } = useToast();

  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialAuthor, setTestimonialAuthor] = useState('');
  const [creatingTestimonial, setCreatingTestimonial] = useState(false);
  const [pressText, setPressText] = useState('');
  const [pressSource, setPressSource] = useState('');
  const [creatingPress, setCreatingPress] = useState(false);

  const [tDrafts, setTDrafts] = useState<Record<string, TestimonialDraft>>({});
  const [pDrafts, setPDrafts] = useState<Record<string, PressDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'testimonial' | 'press' } | null>(null);

  const getTDraft = (item: any): TestimonialDraft =>
    tDrafts[item._id] ?? { text: item.text, author: item.author, enabled: item.enabled !== false };

  const getPDraft = (item: any): PressDraft =>
    pDrafts[item._id] ?? { text: item.text, source: item.source, enabled: item.enabled !== false };

  const isTDirty = (item: any) => {
    const d = tDrafts[item._id];
    if (!d) return false;
    return d.text !== item.text || d.author !== item.author || d.enabled !== (item.enabled !== false);
  };

  const isPDirty = (item: any) => {
    const d = pDrafts[item._id];
    if (!d) return false;
    return d.text !== item.text || d.source !== item.source || d.enabled !== (item.enabled !== false);
  };

  const handleSaveTestimonial = async (id: string) => {
    const item = testimonials.find((t) => t._id === id);
    if (!item) return;
    const draft = getTDraft(item);
    setSavingId(id);
    try {
      await updateTestimonial({ id: id as any, text: draft.text, author: draft.author, enabled: draft.enabled });
      toast('Testimonial updated');
      setTDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err: any) {
      toast(err?.message ?? 'Failed to save', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleSavePress = async (id: string) => {
    const item = pressQuotes.find((p) => p._id === id);
    if (!item) return;
    const draft = getPDraft(item);
    setSavingId(id);
    try {
      await updatePress({ id: id as any, text: draft.text, source: draft.source, enabled: draft.enabled });
      toast('Press quote updated');
      setPDrafts((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch (err: any) {
      toast(err?.message ?? 'Failed to save', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'testimonial') {
        await removeTestimonial({ id: deleteTarget.id as any });
        toast('Testimonial deleted');
      } else {
        await removePress({ id: deleteTarget.id as any });
        toast('Press quote deleted');
      }
    } catch (err: any) {
      toast(err?.message ?? 'Failed to delete', 'error');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl mb-4">Testimonials</h2>
        <div className="space-y-4">
          {testimonials.map((item) => {
            const draft = getTDraft(item);
            const dirty = isTDirty(item);
            const isSaving = savingId === item._id;
            return (
              <div key={item._id} className="p-4 bg-white border border-[#111]/10 space-y-3">
                <FormField label="Quote Text">
                  <textarea
                    value={draft.text}
                    onChange={(e) => setTDrafts((prev) => ({ ...prev, [item._id]: { ...getTDraft(item), text: e.target.value } }))}
                    className={`${fieldTextareaClass} min-h-16`}
                  />
                </FormField>
                <FormField label="Author">
                  <input
                    value={draft.author}
                    onChange={(e) => setTDrafts((prev) => ({ ...prev, [item._id]: { ...getTDraft(item), author: e.target.value } }))}
                    className={fieldInputClass}
                  />
                </FormField>
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-widest flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={(e) => setTDrafts((prev) => ({ ...prev, [item._id]: { ...getTDraft(item), enabled: e.target.checked } }))}
                    />
                    Enabled
                  </label>
                  <div className="flex items-center gap-2">
                    {dirty && (
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        disabled={isSaving}
                        onClick={() => handleSaveTestimonial(item._id)}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-3 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => setDeleteTarget({ id: item._id, type: 'testimonial' })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-white/80 border border-[#111]/10 p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] mb-3">Add Testimonial</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCreatingTestimonial(true);
              try {
                await createTestimonial({ text: testimonialText, author: testimonialAuthor, enabled: true });
                toast('Testimonial added');
                setTestimonialText('');
                setTestimonialAuthor('');
              } catch (err: any) {
                toast(err?.message ?? 'Failed to create', 'error');
              } finally {
                setCreatingTestimonial(false);
              }
            }}
            className="space-y-3"
          >
            <FormField label="Quote Text" required>
              <textarea
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                className={`${fieldTextareaClass} min-h-16`}
                required
              />
            </FormField>
            <FormField label="Author" required>
              <input
                value={testimonialAuthor}
                onChange={(e) => setTestimonialAuthor(e.target.value)}
                className={fieldInputClass}
                required
              />
            </FormField>
            <button className="btn-primary" type="submit" disabled={creatingTestimonial}>
              {creatingTestimonial ? 'Adding...' : 'Add Testimonial'}
            </button>
          </form>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-4">Press Quotes</h2>
        <div className="space-y-4">
          {pressQuotes.map((item) => {
            const draft = getPDraft(item);
            const dirty = isPDirty(item);
            const isSaving = savingId === item._id;
            return (
              <div key={item._id} className="p-4 bg-white border border-[#111]/10 space-y-3">
                <FormField label="Quote Text">
                  <textarea
                    value={draft.text}
                    onChange={(e) => setPDrafts((prev) => ({ ...prev, [item._id]: { ...getPDraft(item), text: e.target.value } }))}
                    className={`${fieldTextareaClass} min-h-16`}
                  />
                </FormField>
                <FormField label="Source">
                  <input
                    value={draft.source}
                    onChange={(e) => setPDrafts((prev) => ({ ...prev, [item._id]: { ...getPDraft(item), source: e.target.value } }))}
                    className={fieldInputClass}
                  />
                </FormField>
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-widest flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.enabled}
                      onChange={(e) => setPDrafts((prev) => ({ ...prev, [item._id]: { ...getPDraft(item), enabled: e.target.checked } }))}
                    />
                    Enabled
                  </label>
                  <div className="flex items-center gap-2">
                    {dirty && (
                      <button
                        type="button"
                        className="btn-primary text-xs"
                        disabled={isSaving}
                        onClick={() => handleSavePress(item._id)}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-3 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => setDeleteTarget({ id: item._id, type: 'press' })}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 bg-white/80 border border-[#111]/10 p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] mb-3">Add Press Quote</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setCreatingPress(true);
              try {
                await createPress({ text: pressText, source: pressSource, enabled: true });
                toast('Press quote added');
                setPressText('');
                setPressSource('');
              } catch (err: any) {
                toast(err?.message ?? 'Failed to create', 'error');
              } finally {
                setCreatingPress(false);
              }
            }}
            className="space-y-3"
          >
            <FormField label="Quote Text" required>
              <textarea
                value={pressText}
                onChange={(e) => setPressText(e.target.value)}
                className={`${fieldTextareaClass} min-h-16`}
                required
              />
            </FormField>
            <FormField label="Source" required>
              <input
                value={pressSource}
                onChange={(e) => setPressSource(e.target.value)}
                className={fieldInputClass}
                required
              />
            </FormField>
            <button className="btn-primary" type="submit" disabled={creatingPress}>
              {creatingPress ? 'Adding...' : 'Add Quote'}
            </button>
          </form>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={deleteTarget?.type === 'testimonial' ? 'Delete Testimonial' : 'Delete Press Quote'}
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
