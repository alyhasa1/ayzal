import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormField, {
  fieldInputClass,
  fieldSelectClass,
  fieldTextareaClass,
} from "@/components/admin/FormField";
import { useToast } from "@/components/admin/Toast";

type PromotionDraft = {
  name: string;
  type: "percent" | "fixed" | "shipping";
  value: string;
  currency: string;
  startsAt: string;
  endsAt: string;
  minSubtotal: string;
  maxRedemptions: string;
  perCustomerLimit: string;
  active: boolean;
  stackable: boolean;
  codes: string;
  productIds: string[];
  categoryIds: string[];
};

const emptyDraft: PromotionDraft = {
  name: "",
  type: "percent",
  value: "",
  currency: "PKR",
  startsAt: "",
  endsAt: "",
  minSubtotal: "",
  maxRedemptions: "",
  perCustomerLimit: "",
  active: true,
  stackable: false,
  codes: "",
  productIds: [],
  categoryIds: [],
};

function parseDateInput(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export default function AdminPromotions() {
  const promotionsQuery = useQuery(api.discounts.adminList);
  const categoriesQuery = useQuery(api.categories.list);
  const productsQuery = useQuery(api.products.list);
  const createPromotion = useMutation(api.discounts.adminCreate);
  const updatePromotion = useMutation(api.discounts.adminUpdate);
  const { toast } = useToast();

  const [draft, setDraft] = useState<PromotionDraft>(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addingCodeById, setAddingCodeById] = useState<Record<string, string>>({});

  const sortedPromotions = useMemo(
    () => [...(promotionsQuery ?? [])].sort((a: any, b: any) => b.updated_at - a.updated_at),
    [promotionsQuery]
  );
  const sortedCategories = useMemo(
    () => [...(categoriesQuery ?? [])].sort((a: any, b: any) => a.name.localeCompare(b.name)),
    [categoriesQuery]
  );
  const sortedProducts = useMemo(
    () => [...(productsQuery ?? [])].sort((a: any, b: any) => a.name.localeCompare(b.name)),
    [productsQuery]
  );
  const categoryNameById = useMemo(
    () =>
      new Map(
        (categoriesQuery ?? []).map((category: any) => [String(category._id), category.name as string])
      ),
    [categoriesQuery]
  );
  const productNameById = useMemo(
    () =>
      new Map((productsQuery ?? []).map((product: any) => [String(product._id), product.name as string])),
    [productsQuery]
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(draft.value);
    if (!Number.isFinite(value) || value <= 0) {
      toast("Enter a valid discount value", "error");
      return;
    }

    const codes = draft.codes
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (codes.length === 0) {
      toast("Add at least one coupon code", "error");
      return;
    }

    setCreating(true);
    try {
      const eligibility =
        draft.categoryIds.length > 0 || draft.productIds.length > 0
          ? {
              category_ids: draft.categoryIds,
              product_ids: draft.productIds,
            }
          : undefined;

      await createPromotion({
        name: draft.name.trim(),
        type: draft.type,
        value,
        currency: draft.currency.trim() || undefined,
        starts_at: parseDateInput(draft.startsAt),
        ends_at: parseDateInput(draft.endsAt),
        min_subtotal: draft.minSubtotal ? Number(draft.minSubtotal) : undefined,
        max_redemptions: draft.maxRedemptions ? Number(draft.maxRedemptions) : undefined,
        per_customer_limit: draft.perCustomerLimit
          ? Number(draft.perCustomerLimit)
          : undefined,
        active: draft.active,
        stackable: draft.stackable,
        eligibility,
        codes,
      });
      setDraft(emptyDraft);
      toast("Promotion created");
    } catch (error: any) {
      toast(error?.message ?? "Failed to create promotion", "error");
    } finally {
      setCreating(false);
    }
  };

  const togglePromotionState = async (promotion: any) => {
    setSavingId(promotion._id);
    try {
      await updatePromotion({
        id: promotion._id,
        active: !promotion.active,
      });
      toast(promotion.active ? "Promotion disabled" : "Promotion enabled");
    } catch (error: any) {
      toast(error?.message ?? "Unable to update promotion", "error");
    } finally {
      setSavingId(null);
    }
  };

  const addCode = async (promotionId: string) => {
    const code = (addingCodeById[promotionId] ?? "").trim();
    if (!code) return;
    setSavingId(promotionId);
    try {
      await updatePromotion({
        id: promotionId as any,
        add_codes: [code],
      });
      setAddingCodeById((prev) => ({ ...prev, [promotionId]: "" }));
      toast("Code added");
    } catch (error: any) {
      toast(error?.message ?? "Unable to add code", "error");
    } finally {
      setSavingId(null);
    }
  };

  const deactivateCode = async (promotionId: string, codeId: string) => {
    setSavingId(promotionId);
    try {
      await updatePromotion({
        id: promotionId as any,
        deactivate_codes: [codeId as any],
      });
      toast("Code deactivated");
    } catch (error: any) {
      toast(error?.message ?? "Unable to update code", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8">
      <div className="bg-white/80 border border-[#111]/10 p-6">
        <h2 className="font-display text-xl mb-4">Create Promotion</h2>
        <form onSubmit={handleCreate} className="space-y-3 text-sm">
          <FormField label="Name" required>
            <input
              className={fieldInputClass}
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Type" required>
              <select
                className={fieldSelectClass}
                value={draft.type}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    type: event.target.value as PromotionDraft["type"],
                  }))
                }
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed Amount</option>
                <option value="shipping">Shipping Discount</option>
              </select>
            </FormField>
            <FormField label={draft.type === "percent" ? "Value (%)" : "Value (PKR)"} required>
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                step={draft.type === "percent" ? 1 : 0.01}
                value={draft.value}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, value: event.target.value }))
                }
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Starts At">
              <input
                className={fieldInputClass}
                type="datetime-local"
                value={draft.startsAt}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, startsAt: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Ends At">
              <input
                className={fieldInputClass}
                type="datetime-local"
                value={draft.endsAt}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, endsAt: event.target.value }))
                }
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="Min Subtotal">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={draft.minSubtotal}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, minSubtotal: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Max Redemptions">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={draft.maxRedemptions}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, maxRedemptions: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Per Customer Limit">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={draft.perCustomerLimit}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, perCustomerLimit: event.target.value }))
                }
              />
            </FormField>
          </div>

          <FormField label="Codes" hint="Use commas or new lines between codes" required>
            <textarea
              className={`${fieldTextareaClass} min-h-24`}
              value={draft.codes}
              onChange={(event) => setDraft((prev) => ({ ...prev, codes: event.target.value }))}
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Eligible Categories" hint="Optional. Leave empty for all categories.">
              <select
                multiple
                className={`${fieldSelectClass} min-h-36`}
                value={draft.categoryIds}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    categoryIds: Array.from(event.target.selectedOptions).map(
                      (option) => option.value
                    ),
                  }))
                }
              >
                {sortedCategories.map((category: any) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Eligible Products" hint="Optional. Leave empty for all products.">
              <select
                multiple
                className={`${fieldSelectClass} min-h-36`}
                value={draft.productIds}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    productIds: Array.from(event.target.selectedOptions).map(
                      (option) => option.value
                    ),
                  }))
                }
              >
                {sortedProducts.map((product: any) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="flex items-center gap-6">
            <label className="text-xs uppercase tracking-widest flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, active: event.target.checked }))
                }
              />
              Active
            </label>
            <label className="text-xs uppercase tracking-widest flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.stackable}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, stackable: event.target.checked }))
                }
              />
              Stackable
            </label>
          </div>

          <button className="btn-primary w-full" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Promotion"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Existing Promotions</h2>
          <p className="text-xs text-[#6E6E6E]">{sortedPromotions.length} total</p>
        </div>

        {sortedPromotions.length === 0 ? (
          <div className="bg-white border border-[#111]/10 p-6 text-sm text-[#6E6E6E]">
            No promotions yet.
          </div>
        ) : (
          sortedPromotions.map((promotion: any) => (
            <article key={promotion._id} className="bg-white border border-[#111]/10 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-sm">{promotion.name}</h3>
                  <p className="text-xs text-[#6E6E6E] uppercase tracking-widest mt-1">
                    {promotion.type} • value {promotion.value}
                    {promotion.type === "percent" ? "%" : " PKR"}
                  </p>
                </div>
                <button
                  type="button"
                  className={`text-xs px-3 py-1 border ${
                    promotion.active
                      ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                      : "border-[#111]/10 text-[#6E6E6E]"
                  }`}
                  disabled={savingId === promotion._id}
                  onClick={() => togglePromotionState(promotion)}
                >
                  {savingId === promotion._id
                    ? "Saving..."
                    : promotion.active
                    ? "Active"
                    : "Inactive"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#6E6E6E]">
                <p>Starts: {promotion.starts_at ? new Date(promotion.starts_at).toLocaleString() : "Anytime"}</p>
                <p>Ends: {promotion.ends_at ? new Date(promotion.ends_at).toLocaleString() : "No expiry"}</p>
                <p>Min Subtotal: {promotion.min_subtotal ?? "None"}</p>
                <p>Stackable: {promotion.stackable ? "Yes" : "No"}</p>
                <p>
                  Categories:{" "}
                  {(promotion.eligibility?.category_ids ?? [])
                    .map((id: string) => categoryNameById.get(String(id)) ?? String(id))
                    .join(", ") || "All"}
                </p>
                <p>
                  Products:{" "}
                  {(promotion.eligibility?.product_ids ?? [])
                    .map((id: string) => productNameById.get(String(id)) ?? String(id))
                    .join(", ") || "All"}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Codes</p>
                <div className="flex flex-wrap gap-2">
                  {(promotion.codes ?? []).map((code: any) => (
                    <span
                      key={code._id}
                      className={`inline-flex items-center gap-1 px-2 py-1 border text-xs ${
                        code.active
                          ? "border-[#111]/10 bg-[#111]/5"
                          : "border-red-200 text-red-500 bg-red-50"
                      }`}
                    >
                      {code.code}
                      {code.active ? (
                        <button
                          type="button"
                          className="underline"
                          onClick={() => deactivateCode(promotion._id, code._id)}
                        >
                          deactivate
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={addingCodeById[promotion._id] ?? ""}
                    onChange={(event) =>
                      setAddingCodeById((prev) => ({
                        ...prev,
                        [promotion._id]: event.target.value,
                      }))
                    }
                    className="flex-1 border border-[#111]/10 px-3 py-2 text-sm"
                    placeholder="Add new code"
                  />
                  <button
                    type="button"
                    className="px-4 border border-[#111]/15 text-sm hover:border-[#D4A05A]"
                    onClick={() => addCode(promotion._id)}
                  >
                    Add
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
