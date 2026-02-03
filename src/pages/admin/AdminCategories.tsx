import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminCategories() {
  const categories = useQuery(api.categories.listWithCounts) ?? [];
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const removeCategory = useMutation(api.categories.remove);

  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [reassignId, setReassignId] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (editId) {
      await updateCategory({ id: editId as any, name, image_url: imageUrl });
      setEditId(null);
    } else {
      await createCategory({ name, image_url: imageUrl });
    }
    setName('');
    setImageUrl('');
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
          <div key={category._id} className="p-4 bg-white border border-[#111]/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{category.name}</p>
                <p className="text-xs text-[#6E6E6E]">Products: {category.productCount}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-xs border border-[#111]/10"
                  onClick={() => startEdit(category)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 text-xs border border-red-200 text-red-500"
                  onClick={() => removeCategory({ id: category._id, reassign_to: reassignId as any })}
                  disabled={!reassignId || reassignId === category._id}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border border-[#111]/10 px-2 py-1 text-xs"
                value={reassignId}
                onChange={(e) => setReassignId(e.target.value)}
              >
                <option value="">Reassign products to...</option>
                {categories
                  .filter((item) => item._id !== category._id)
                  .map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              {category.productCount > 0 && (
                <p className="text-xs text-[#6E6E6E]">Required to delete</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/80 border border-[#111]/10 p-6">
        <h3 className="font-display text-lg mb-4">
          {editId ? 'Edit Category' : 'Add Category'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <div className="flex gap-3">
            <button className="btn-primary flex-1" type="submit">
              {editId ? 'Update' : 'Create'}
            </button>
            {editId && (
              <button
                type="button"
                className="flex-1 border border-[#111]/10"
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
    </div>
  );
}
