import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { mapProduct } from '@/lib/mappers';

const emptyForm = {
  name: '',
  price: 0,
  sku: '',
  description: '',
  fabric: '',
  work: '',
  includes: '',
  care: '',
  sizes: '',
  dimensions_kameez: '',
  dimensions_dupatta: '',
  dimensions_shalwar: '',
  primary_image_url: '',
  image_urls: '',
  category_id: '',
  in_stock: true,
  is_new_arrival: false,
  spotlight_rank: '',
  payment_method_ids: [] as string[],
  slug: '',
  meta_title: '',
  meta_description: '',
};

export default function AdminProducts() {
  const productsRaw = useQuery(api.products.list) ?? [];
  const categories = useQuery(api.categories.list) ?? [];
  const paymentMethods = useQuery(api.paymentMethods.list) ?? [];
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);

  const products = useMemo(() => productsRaw.map(mapProduct), [productsRaw]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setForm({
      name: product.name ?? '',
      price: product.price ?? 0,
      sku: product.sku ?? '',
      description: product.description ?? '',
      fabric: product.fabric ?? '',
      work: product.work ?? '',
      includes: product.includes?.join('\n') ?? '',
      care: product.care?.join('\n') ?? '',
      sizes: product.sizes?.join('\n') ?? '',
      dimensions_kameez: product.dimensions?.kameez ?? '',
      dimensions_dupatta: product.dimensions?.dupatta ?? '',
      dimensions_shalwar: product.dimensions?.shalwar ?? '',
      primary_image_url: product.image ?? '',
      image_urls: product.images?.join('\n') ?? '',
      category_id: product.categoryId ?? '',
      in_stock: product.inStock ?? true,
      is_new_arrival: product.isNewArrival ?? false,
      spotlight_rank: product.spotlightRank ? String(product.spotlightRank) : '',
      payment_method_ids: product.paymentMethods?.map((method: any) => method.id) ?? [],
      slug: product.slug ?? '',
      meta_title: product.metaTitle ?? '',
      meta_description: product.metaDescription ?? '',
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      price: Number(form.price),
      sku: form.sku || undefined,
      description: form.description || undefined,
      fabric: form.fabric || undefined,
      work: form.work || undefined,
      includes: form.includes ? form.includes.split('\n').map((item) => item.trim()).filter(Boolean) : undefined,
      care: form.care ? form.care.split('\n').map((item) => item.trim()).filter(Boolean) : undefined,
      sizes: form.sizes ? form.sizes.split('\n').map((item) => item.trim()).filter(Boolean) : undefined,
      dimensions: form.dimensions_kameez && form.dimensions_dupatta && form.dimensions_shalwar ? {
        kameez: form.dimensions_kameez,
        dupatta: form.dimensions_dupatta,
        shalwar: form.dimensions_shalwar,
      } : undefined,
      primary_image_url: form.primary_image_url,
      image_urls: form.image_urls ? form.image_urls.split('\n').map((item) => item.trim()).filter(Boolean) : undefined,
      category_id: form.category_id as any,
      in_stock: form.in_stock,
      is_new_arrival: form.is_new_arrival,
      spotlight_rank: form.spotlight_rank ? Number(form.spotlight_rank) : undefined,
      payment_method_ids: form.payment_method_ids as any,
      meta_title: form.meta_title || undefined,
      meta_description: form.meta_description || undefined,
    };

    if (editingId) {
      await updateProduct({ id: editingId as any, ...payload });
    } else {
      await createProduct(payload as any);
    }
    resetForm();
  };

  const togglePaymentMethod = (id: string) => {
    setForm((prev) => {
      const exists = prev.payment_method_ids.includes(id);
      return {
        ...prev,
        payment_method_ids: exists
          ? prev.payment_method_ids.filter((item) => item !== id)
          : [...prev.payment_method_ids, id],
      };
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
      <div>
        <h2 className="font-display text-xl mb-4">Products</h2>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="p-4 bg-white border border-[#111]/10 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                <p className="text-xs text-[#6E6E6E]">{product.category}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 text-xs border border-[#111]/10 hover:border-[#D4A05A]"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-1 text-xs border border-red-200 text-red-500"
                  onClick={() => removeProduct({ id: product.id as any })}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/80 border border-[#111]/10 p-6">
        <h3 className="font-display text-lg mb-4">
          {editingId ? 'Edit Product' : 'Add Product'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          {editingId && (
            <input
              value={form.slug}
              readOnly
              placeholder="Slug"
              className="w-full border border-[#111]/10 px-3 py-2 bg-[#111]/5 text-[#6E6E6E]"
            />
          )}
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            placeholder="Price"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            placeholder="SKU"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="w-full border border-[#111]/10 px-3 py-2 min-h-20"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={form.fabric}
              onChange={(e) => setForm({ ...form, fabric: e.target.value })}
              placeholder="Fabric"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
            <input
              value={form.work}
              onChange={(e) => setForm({ ...form, work: e.target.value })}
              placeholder="Work"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
          </div>
          <textarea
            value={form.includes}
            onChange={(e) => setForm({ ...form, includes: e.target.value })}
            placeholder="Includes (one per line)"
            className="w-full border border-[#111]/10 px-3 py-2 min-h-20"
          />
          <textarea
            value={form.care}
            onChange={(e) => setForm({ ...form, care: e.target.value })}
            placeholder="Care instructions (one per line)"
            className="w-full border border-[#111]/10 px-3 py-2 min-h-20"
          />
          <textarea
            value={form.sizes}
            onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            placeholder="Sizes (one per line)"
            className="w-full border border-[#111]/10 px-3 py-2 min-h-16"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={form.dimensions_kameez}
              onChange={(e) => setForm({ ...form, dimensions_kameez: e.target.value })}
              placeholder="Kameez"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
            <input
              value={form.dimensions_dupatta}
              onChange={(e) => setForm({ ...form, dimensions_dupatta: e.target.value })}
              placeholder="Dupatta"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
            <input
              value={form.dimensions_shalwar}
              onChange={(e) => setForm({ ...form, dimensions_shalwar: e.target.value })}
              placeholder="Shalwar"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
          </div>
          <input
            value={form.primary_image_url}
            onChange={(e) => setForm({ ...form, primary_image_url: e.target.value })}
            placeholder="Primary image URL"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <textarea
            value={form.image_urls}
            onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
            placeholder="Additional image URLs (one per line)"
            className="w-full border border-[#111]/10 px-3 py-2 min-h-16"
          />
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) => setForm({ ...form, in_stock: e.target.checked })}
              />
              In stock
            </label>
            <label className="flex items-center gap-2 text-xs uppercase tracking-widest">
              <input
                type="checkbox"
                checked={form.is_new_arrival}
                onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })}
              />
              New arrival
            </label>
          </div>
          <input
            value={form.spotlight_rank}
            onChange={(e) => setForm({ ...form, spotlight_rank: e.target.value })}
            placeholder="Spotlight rank (number)"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
          <div className="space-y-2">
            <p className="label-text text-[#6E6E6E]">Payment Methods</p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <label key={method._id} className="flex items-center gap-2 text-xs uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={form.payment_method_ids.includes(method._id)}
                    onChange={() => togglePaymentMethod(method._id)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3 border-t border-[#111]/10 pt-4 mt-4">
            <p className="label-text text-[#6E6E6E]">SEO</p>
            <div>
              <input
                value={form.meta_title}
                onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                placeholder="SEO Title (leave blank for auto)"
                className="w-full border border-[#111]/10 px-3 py-2"
              />
              <p className={`text-xs mt-1 ${form.meta_title.length > 60 ? 'text-red-500' : 'text-[#6E6E6E]'}`}>
                {form.meta_title.length}/60 characters
              </p>
            </div>
            <div>
              <textarea
                value={form.meta_description}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                placeholder="SEO Description (leave blank for auto)"
                className="w-full border border-[#111]/10 px-3 py-2 min-h-16"
              />
              <p className={`text-xs mt-1 ${form.meta_description.length > 160 ? 'text-red-500' : 'text-[#6E6E6E]'}`}>
                {form.meta_description.length}/160 characters
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button className="btn-primary flex-1" type="submit">
              {editingId ? 'Update' : 'Create'}
            </button>
            {editingId && (
              <button type="button" className="flex-1 border border-[#111]/10" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
