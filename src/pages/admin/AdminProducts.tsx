import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { mapProduct } from '@/lib/mappers';
import { formatPrice } from '@/lib/format';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import FormField, { fieldInputClass, fieldTextareaClass, fieldSelectClass } from '@/components/admin/FormField';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/Toast';

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
  tags: '',
};

function parseTagDraft(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function ImagePreview({ url, alt }: { url: string; alt?: string }) {
  if (!url) return null;
  return (
    <div className="mt-1.5 w-20 h-20 border border-[#111]/10 bg-gray-50 overflow-hidden">
      <img
        src={url}
        alt={alt ?? 'Preview'}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    </div>
  );
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-[#111]/10 pt-4 mt-4">
      <button
        type="button"
        className="flex items-center justify-between w-full text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
          {title}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-[#6E6E6E]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6E6E6E]" />
        )}
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  );
}

export default function AdminProducts() {
  const productsRawQuery = useQuery(api.products.list);
  const categories = useQuery(api.categories.list) ?? [];
  const paymentMethods = useQuery(api.paymentMethods.list) ?? [];
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const setProductTags = useMutation(api.products.setTags);
  const removeProduct = useMutation(api.products.remove);
  const { toast } = useToast();

  const products = useMemo(() => (productsRawQuery ?? []).map(mapProduct), [productsRawQuery]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStock, setFilterStock] = useState<'' | 'in' | 'out'>('');

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    if (filterCategory) {
      list = list.filter((p) => p.categoryId === filterCategory);
    }
    if (filterStock === 'in') {
      list = list.filter((p) => p.inStock !== false);
    } else if (filterStock === 'out') {
      list = list.filter((p) => p.inStock === false);
    }
    return list;
  }, [products, searchQuery, filterCategory, filterStock]);

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
      tags: product.tags?.join(', ') ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
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
        await setProductTags({ id: editingId as any, tags: parseTagDraft(form.tags) });
        toast('Product updated');
      } else {
        const createdId = await createProduct(payload as any);
        await setProductTags({ id: createdId as any, tags: parseTagDraft(form.tags) });
        toast('Product created');
      }
      resetForm();
    } catch (err: any) {
      toast(err?.message ?? 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeProduct({ id: deleteTarget.id as any });
      toast('Product deleted');
      if (editingId === deleteTarget.id) resetForm();
    } catch (err: any) {
      toast(err?.message ?? 'Failed to delete', 'error');
    }
    setDeleteTarget(null);
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl">Products</h2>
          <span className="text-xs text-[#6E6E6E]">{filteredProducts.length} of {products.length}</span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full border border-[#111]/10 pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4A05A]"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-[#111]/10 px-2 py-1.5 text-xs bg-white"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value as '' | 'in' | 'out')}
              className="border border-[#111]/10 px-2 py-1.5 text-xs bg-white"
            >
              <option value="">All stock</option>
              <option value="in">In stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-3 bg-white border border-[#111]/10 flex items-center gap-3">
              <div className="w-12 h-12 flex-shrink-0 bg-gray-100 overflow-hidden border border-[#111]/5">
                {product.image && (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{product.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#6E6E6E]">{product.category}</span>
                  <span className="text-xs font-medium">{formatPrice(product.price)}</span>
                  {product.inStock === false ? (
                    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-100">
                      Out of stock
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100">
                      In stock
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  className="px-2.5 py-1 text-xs border border-[#111]/10 hover:border-[#D4A05A] transition-colors"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="px-2.5 py-1 text-xs border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <p className="text-sm text-[#6E6E6E] py-4 text-center">No products found.</p>
          )}
        </div>
      </div>

      <div className="bg-white/80 border border-[#111]/10 p-6">
        <h3 className="font-display text-lg mb-4">
          {editingId ? 'Edit Product' : 'Add Product'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <FormField label="Product Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={fieldInputClass}
              required
            />
          </FormField>

          {editingId && (
            <FormField label="Slug" hint="Auto-generated, read-only">
              <input
                value={form.slug}
                readOnly
                className={`${fieldInputClass} bg-[#111]/5 text-[#6E6E6E]`}
              />
            </FormField>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Price (PKR)" required>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className={fieldInputClass}
                required
                min={0}
              />
            </FormField>
            <FormField label="SKU">
              <input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className={fieldInputClass}
              />
            </FormField>
          </div>

          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={`${fieldTextareaClass} min-h-20`}
            />
          </FormField>

          <Section title="Media">
            <FormField label="Primary Image URL" required>
              <input
                value={form.primary_image_url}
                onChange={(e) => setForm({ ...form, primary_image_url: e.target.value })}
                className={fieldInputClass}
                required
              />
              <ImagePreview url={form.primary_image_url} alt="Primary" />
            </FormField>
            <FormField label="Additional Image URLs" hint="One URL per line">
              <textarea
                value={form.image_urls}
                onChange={(e) => setForm({ ...form, image_urls: e.target.value })}
                className={`${fieldTextareaClass} min-h-16`}
              />
              {form.image_urls && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {form.image_urls
                    .split('\n')
                    .map((u) => u.trim())
                    .filter(Boolean)
                    .map((url, i) => (
                      <ImagePreview key={i} url={url} alt={`Image ${i + 1}`} />
                    ))}
                </div>
              )}
            </FormField>
          </Section>

          <Section title="Details" defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField label="Fabric">
                <input
                  value={form.fabric}
                  onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                  className={fieldInputClass}
                />
              </FormField>
              <FormField label="Work">
                <input
                  value={form.work}
                  onChange={(e) => setForm({ ...form, work: e.target.value })}
                  className={fieldInputClass}
                />
              </FormField>
            </div>
            <FormField label="Includes" hint="One item per line">
              <textarea
                value={form.includes}
                onChange={(e) => setForm({ ...form, includes: e.target.value })}
                className={`${fieldTextareaClass} min-h-16`}
              />
            </FormField>
            <FormField label="Care Instructions" hint="One instruction per line">
              <textarea
                value={form.care}
                onChange={(e) => setForm({ ...form, care: e.target.value })}
                className={`${fieldTextareaClass} min-h-16`}
              />
            </FormField>
            <FormField label="Sizes" hint="One size per line">
              <textarea
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
                className={`${fieldTextareaClass} min-h-16`}
              />
            </FormField>
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">Dimensions</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FormField label="Kameez">
                  <input
                    value={form.dimensions_kameez}
                    onChange={(e) => setForm({ ...form, dimensions_kameez: e.target.value })}
                    className={fieldInputClass}
                  />
                </FormField>
                <FormField label="Dupatta">
                  <input
                    value={form.dimensions_dupatta}
                    onChange={(e) => setForm({ ...form, dimensions_dupatta: e.target.value })}
                    className={fieldInputClass}
                  />
                </FormField>
                <FormField label="Shalwar">
                  <input
                    value={form.dimensions_shalwar}
                    onChange={(e) => setForm({ ...form, dimensions_shalwar: e.target.value })}
                    className={fieldInputClass}
                  />
                </FormField>
              </div>
            </div>
          </Section>

          <Section title="Category & Stock">
            <FormField label="Category" required>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className={fieldSelectClass}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="flex items-center gap-4">
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
            <FormField label="Spotlight Rank" hint="Lower number = higher priority">
              <input
                type="number"
                value={form.spotlight_rank}
                onChange={(e) => setForm({ ...form, spotlight_rank: e.target.value })}
                className={fieldInputClass}
                min={0}
              />
            </FormField>
            <FormField label="Payment Methods">
              <div className="flex flex-wrap gap-3 mt-1">
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
            </FormField>
            <FormField
              label="Discovery Tags"
              hint="Use commas or new lines. These improve search and recommendation quality."
            >
              <textarea
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className={`${fieldTextareaClass} min-h-16`}
                placeholder="bridal, handwork, festive, eid-edit"
              />
            </FormField>
          </Section>

          <Section title="SEO" defaultOpen={false}>
            <FormField label="SEO Title" hint="Leave blank for auto-generated">
              <input
                value={form.meta_title}
                onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
                className={fieldInputClass}
              />
              <p className={`text-xs mt-1 ${form.meta_title.length > 60 ? 'text-red-500' : 'text-[#6E6E6E]'}`}>
                {form.meta_title.length}/60 characters
              </p>
            </FormField>
            <FormField label="SEO Description" hint="Leave blank for auto-generated">
              <textarea
                value={form.meta_description}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                className={`${fieldTextareaClass} min-h-16`}
              />
              <p className={`text-xs mt-1 ${form.meta_description.length > 160 ? 'text-red-500' : 'text-[#6E6E6E]'}`}>
                {form.meta_description.length}/160 characters
              </p>
            </FormField>
          </Section>

          <div className="flex gap-3 pt-4">
            <button className="btn-primary flex-1" type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </button>
            {editingId && (
              <button type="button" className="flex-1 border border-[#111]/10 hover:bg-[#111]/5 transition-colors" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
