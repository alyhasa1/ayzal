import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import FormField, { fieldInputClass, fieldSelectClass } from '@/components/admin/FormField';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

export default function AdminCategories() {
  const categories = useQuery(api.categories.listWithCounts) ?? [];
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; productCount: number } | null>(null);
  const [reassignId, setReassignId] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateCategory({ id: editId as any, name, image_url: imageUrl });
        toast('Category updated');
        setEditId(null);
      } else {
        await createCategory({ name, image_url: imageUrl });
        toast('Category created');
      }
      setName('');
      setImageUrl('');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.productCount > 0 && !reassignId) {
      toast('Select a category to reassign products to first', 'error');
      return;
    }
    try {
      await removeCategory({ id: deleteTarget.id as any, reassign_to: reassignId as any });
      toast('Category deleted');
      setReassignId('');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to delete', 'error');
    }
    setDeleteTarget(null);
  };

  const startEdit = (category: any) => {
    setEditId(category._id);
    setName(category.name);
    setImageUrl(category.image_url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.6fr] gap-8">
      <div className="space-y-4">
        <h2 className="font-display text-xl">Categories</h2>
        {categories.map((category) => (
          <div key={category._id} className="p-4 bg-white border border-[#111]/10 flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 bg-gray-100 overflow-hidden border border-[#111]/5">
              {category.image_url && (
                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{category.name}</p>
              <p className="text-xs text-[#6E6E6E]">{category.productCount} product{category.productCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                className="px-2.5 py-1 text-xs border border-[#111]/10 hover:border-[#D4A05A] transition-colors"
                onClick={() => startEdit(category)}
              >
                Edit
              </button>
              <button
                className="px-2.5 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                onClick={() =>
                  setDeleteTarget({
                    id: category._id,
                    name: category.name,
                    productCount: category.productCount,
                  })
                }
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/80 border border-[#111]/10 p-6">
        <h3 className="font-display text-lg mb-4">
          {editId ? 'Edit Category' : 'Add Category'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <FormField label="Category Name" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldInputClass}
              required
            />
          </FormField>
          <FormField label="Image URL" required>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className={fieldInputClass}
              required
            />
            {imageUrl && (
              <div className="mt-1.5 w-20 h-20 border border-[#111]/10 bg-gray-50 overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
          </FormField>
          <div className="flex gap-3">
            <button className="btn-primary flex-1" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
            {editId && (
              <button
                type="button"
                className="flex-1 border border-[#111]/10 hover:bg-[#111]/5 transition-colors"
                onClick={() => {
                  setEditId(null);
                  setName('');
                  setImageUrl('');
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open
          title="Delete Category"
          message={
            deleteTarget.productCount > 0
              ? `"${deleteTarget.name}" has ${deleteTarget.productCount} product(s). Select a category below to reassign them before deleting.`
              : `Are you sure you want to delete "${deleteTarget.name}"?`
          }
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => {
            setDeleteTarget(null);
            setReassignId('');
          }}
        >
          {deleteTarget.productCount > 0 && (
            <div className="mt-3">
              <FormField label="Reassign products to" required>
                <select
                  value={reassignId}
                  onChange={(e) => setReassignId(e.target.value)}
                  className={fieldSelectClass}
                >
                  <option value="">Select category...</option>
                  {categories
                    .filter((c) => c._id !== deleteTarget.id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
              </FormField>
            </div>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
