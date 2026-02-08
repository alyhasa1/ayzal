import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormField, { fieldInputClass, fieldSelectClass } from "@/components/admin/FormField";
import { useToast } from "@/components/admin/Toast";
import { formatPrice } from "@/lib/format";

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function normalizeStockQuantity(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export default function AdminInventory() {
  const overview = useQuery(api.inventory.adminListOverview);
  const createLocation = useMutation(api.inventory.adminCreateLocation);
  const updateLocation = useMutation(api.inventory.adminUpdateLocation);
  const createVariant = useMutation(api.inventory.adminCreateVariant);
  const updateVariant = useMutation(api.inventory.adminUpdateVariant);
  const setLevel = useMutation(api.inventory.adminSetLevel);
  const { toast } = useToast();

  const products = useMemo(() => overview?.products ?? [], [overview?.products]);
  const variants = useMemo(() => overview?.variants ?? [], [overview?.variants]);
  const locations = useMemo(() => overview?.locations ?? [], [overview?.locations]);
  const levels = useMemo(() => overview?.levels ?? [], [overview?.levels]);

  const sortedProducts = useMemo(
    () => [...(overview?.products ?? [])].sort((a: any, b: any) => a.name.localeCompare(b.name)),
    [overview?.products]
  );

  const [locationKey, setLocationKey] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("Pakistan");
  const [locationActive, setLocationActive] = useState(true);
  const [creatingLocation, setCreatingLocation] = useState(false);

  const [variantProductId, setVariantProductId] = useState("");
  const [variantSku, setVariantSku] = useState("");
  const [variantTitle, setVariantTitle] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantCompareAt, setVariantCompareAt] = useState("");
  const [variantInStock, setVariantInStock] = useState(true);
  const [creatingVariant, setCreatingVariant] = useState(false);

  const [levelVariantId, setLevelVariantId] = useState("");
  const [levelLocationId, setLevelLocationId] = useState("");
  const [levelAvailable, setLevelAvailable] = useState("");
  const [levelReserved, setLevelReserved] = useState("");
  const [levelCommitted, setLevelCommitted] = useState("");
  const [levelSafetyStock, setLevelSafetyStock] = useState("");
  const [savingLevel, setSavingLevel] = useState(false);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [levelSearch, setLevelSearch] = useState("");
  const [levelLocationFilter, setLevelLocationFilter] = useState("");

  const locationLevelCount = useMemo(() => {
    const levelRows = overview?.levels ?? [];
    const counts = new Map<string, number>();
    for (const row of levelRows) {
      const key = String(row.location_id);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [overview?.levels]);

  const lowStockCount = useMemo(() => {
    return (overview?.levels ?? []).filter((row: any) => row.sellable <= (row.safety_stock ?? 0)).length;
  }, [overview?.levels]);

  const filteredLevels = useMemo(() => {
    const levelRows = overview?.levels ?? [];
    const query = levelSearch.trim().toLowerCase();
    return levelRows.filter((row: any) => {
      if (levelLocationFilter && String(row.location_id) !== levelLocationFilter) return false;
      if (!query) return true;
      return (
        String(row.product_name || "")
          .toLowerCase()
          .includes(query) ||
        String(row.variant_sku || "")
          .toLowerCase()
          .includes(query) ||
        String(row.variant_title || "")
          .toLowerCase()
          .includes(query) ||
        String(row.location_name || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [overview?.levels, levelSearch, levelLocationFilter]);

  const recentVariants = useMemo(
    () => [...(overview?.variants ?? [])].sort((a: any, b: any) => b.updated_at - a.updated_at).slice(0, 50),
    [overview?.variants]
  );

  const selectedVariant = useMemo(
    () => variants.find((variant: any) => String(variant._id) === levelVariantId) ?? null,
    [variants, levelVariantId]
  );

  const selectedProductForVariantCreate = useMemo(
    () => products.find((product: any) => String(product._id) === variantProductId) ?? null,
    [products, variantProductId]
  );

  const selectedProductForLevel = useMemo(
    () =>
      selectedVariant
        ? products.find((product: any) => String(product._id) === String(selectedVariant.product_id)) ?? null
        : null,
    [products, selectedVariant]
  );

  const selectedExistingLevel = useMemo(() => {
    if (!levelVariantId || !levelLocationId) return null;
    return (
      levels.find(
        (row: any) =>
          String(row.variant_id) === String(levelVariantId) &&
          String(row.location_id) === String(levelLocationId)
      ) ?? null
    );
  }, [levels, levelVariantId, levelLocationId]);

  useEffect(() => {
    if (!variantProductId) {
      setVariantInStock(true);
      return;
    }
    const baseStock = normalizeStockQuantity(selectedProductForVariantCreate?.stock_quantity);
    setVariantInStock(baseStock > 0);
  }, [variantProductId, selectedProductForVariantCreate?.stock_quantity]);

  useEffect(() => {
    if (!levelVariantId || !levelLocationId) return;

    if (selectedExistingLevel) {
      setLevelAvailable(String(selectedExistingLevel.available ?? 0));
      setLevelReserved(String(selectedExistingLevel.reserved ?? 0));
      setLevelCommitted(String(selectedExistingLevel.committed ?? 0));
      setLevelSafetyStock(
        selectedExistingLevel.safety_stock !== undefined
          ? String(selectedExistingLevel.safety_stock)
          : ""
      );
      return;
    }

    const fallbackStock = normalizeStockQuantity(selectedProductForLevel?.stock_quantity);
    setLevelAvailable(String(fallbackStock));
    setLevelReserved("0");
    setLevelCommitted("0");
    setLevelSafetyStock("");
  }, [levelVariantId, levelLocationId, selectedExistingLevel, selectedProductForLevel?.stock_quantity]);

  const handleCreateLocation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!locationKey.trim() || !locationName.trim()) {
      toast("Location key and name are required", "error");
      return;
    }
    setCreatingLocation(true);
    try {
      await createLocation({
        key: locationKey.trim().toLowerCase(),
        name: locationName.trim(),
        city: locationCity.trim() || undefined,
        country: locationCountry.trim() || undefined,
        active: locationActive,
      });
      setLocationKey("");
      setLocationName("");
      setLocationCity("");
      setLocationCountry("Pakistan");
      setLocationActive(true);
      toast("Inventory location created");
    } catch (error: any) {
      toast(error?.message ?? "Unable to create location", "error");
    } finally {
      setCreatingLocation(false);
    }
  };

  const handleCreateVariant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!variantProductId || !variantSku.trim()) {
      toast("Product and SKU are required", "error");
      return;
    }
    const price = parseOptionalNumber(variantPrice);
    const compareAt = parseOptionalNumber(variantCompareAt);
    if (variantPrice.trim() && price === undefined) {
      toast("Enter a valid variant price", "error");
      return;
    }
    if (variantCompareAt.trim() && compareAt === undefined) {
      toast("Enter a valid compare-at price", "error");
      return;
    }

    setCreatingVariant(true);
    try {
      await createVariant({
        product_id: variantProductId as any,
        sku: variantSku.trim(),
        title: variantTitle.trim() || undefined,
        price,
        compare_at_price: compareAt,
        in_stock: variantInStock,
      });
      setVariantProductId("");
      setVariantSku("");
      setVariantTitle("");
      setVariantPrice("");
      setVariantCompareAt("");
      setVariantInStock(true);
      toast("Variant created");
    } catch (error: any) {
      toast(error?.message ?? "Unable to create variant", "error");
    } finally {
      setCreatingVariant(false);
    }
  };

  const handleSetLevel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!levelVariantId || !levelLocationId) {
      toast("Select a variant and location", "error");
      return;
    }

    const available = parseOptionalNumber(levelAvailable);
    const reserved = parseOptionalNumber(levelReserved);
    const committed = parseOptionalNumber(levelCommitted);
    const safetyStock = parseOptionalNumber(levelSafetyStock);
    if (available === undefined || available < 0) {
      toast("Available stock is required", "error");
      return;
    }
    if (reserved !== undefined && reserved < 0) {
      toast("Reserved stock cannot be negative", "error");
      return;
    }
    if (committed !== undefined && committed < 0) {
      toast("Committed stock cannot be negative", "error");
      return;
    }

    setSavingLevel(true);
    try {
      await setLevel({
        variant_id: levelVariantId as any,
        location_id: levelLocationId as any,
        available,
        reserved,
        committed,
        safety_stock: safetyStock,
      });
      setLevelAvailable("");
      setLevelReserved("");
      setLevelCommitted("");
      setLevelSafetyStock("");
      toast("Inventory level updated");
    } catch (error: any) {
      toast(error?.message ?? "Unable to set inventory level", "error");
    } finally {
      setSavingLevel(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Products</p>
          <p className="font-display text-xl">{products.length}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Variants</p>
          <p className="font-display text-xl">{variants.length}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Locations</p>
          <p className="font-display text-xl">{locations.length}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Stock Levels</p>
          <p className="font-display text-xl">{levels.length}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Low Stock</p>
          <p className="font-display text-xl">{lowStockCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <form className="bg-white border border-[#111]/10 p-5 space-y-3" onSubmit={handleCreateLocation}>
          <h2 className="font-display text-lg">Create Location</h2>
          <FormField label="Key" required hint="Example: lahore_wh_1">
            <input
              className={fieldInputClass}
              value={locationKey}
              onChange={(event) => setLocationKey(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Name" required>
            <input
              className={fieldInputClass}
              value={locationName}
              onChange={(event) => setLocationName(event.target.value)}
              required
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="City">
              <input
                className={fieldInputClass}
                value={locationCity}
                onChange={(event) => setLocationCity(event.target.value)}
              />
            </FormField>
            <FormField label="Country">
              <input
                className={fieldInputClass}
                value={locationCountry}
                onChange={(event) => setLocationCountry(event.target.value)}
              />
            </FormField>
          </div>
          <label className="text-xs uppercase tracking-widest flex items-center gap-2">
            <input
              type="checkbox"
              checked={locationActive}
              onChange={(event) => setLocationActive(event.target.checked)}
            />
            Active
          </label>
          <button className="btn-primary w-full" disabled={creatingLocation}>
            {creatingLocation ? "Creating..." : "Create Location"}
          </button>
        </form>

        <form className="bg-white border border-[#111]/10 p-5 space-y-3" onSubmit={handleCreateVariant}>
          <h2 className="font-display text-lg">Create Variant</h2>
          <FormField label="Product" required>
            <select
              className={fieldSelectClass}
              value={variantProductId}
              onChange={(event) => setVariantProductId(event.target.value)}
              required
            >
              <option value="">Select product</option>
              {sortedProducts.map((product: any) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </FormField>
          {selectedProductForVariantCreate ? (
            <p className="text-xs text-[#6E6E6E]">
              Current product stock:{" "}
              <span className="font-medium">
                {normalizeStockQuantity(selectedProductForVariantCreate.stock_quantity)} units
              </span>
            </p>
          ) : null}
          <FormField label="SKU" required>
            <input
              className={fieldInputClass}
              value={variantSku}
              onChange={(event) => setVariantSku(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Title">
            <input
              className={fieldInputClass}
              value={variantTitle}
              onChange={(event) => setVariantTitle(event.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Price">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                step={0.01}
                value={variantPrice}
                onChange={(event) => setVariantPrice(event.target.value)}
              />
            </FormField>
            <FormField label="Compare At">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                step={0.01}
                value={variantCompareAt}
                onChange={(event) => setVariantCompareAt(event.target.value)}
              />
            </FormField>
          </div>
          <label className="text-xs uppercase tracking-widest flex items-center gap-2">
            <input
              type="checkbox"
              checked={variantInStock}
              onChange={(event) => setVariantInStock(event.target.checked)}
            />
            In stock
          </label>
          <button className="btn-primary w-full" disabled={creatingVariant}>
            {creatingVariant ? "Creating..." : "Create Variant"}
          </button>
        </form>

        <form className="bg-white border border-[#111]/10 p-5 space-y-3" onSubmit={handleSetLevel}>
          <h2 className="font-display text-lg">Set Stock Level</h2>
          <FormField label="Variant" required>
            <select
              className={fieldSelectClass}
              value={levelVariantId}
              onChange={(event) => setLevelVariantId(event.target.value)}
              required
            >
              <option value="">Select variant</option>
              {variants.map((variant: any) => (
                <option key={variant._id} value={variant._id}>
                  {variant.product_name} - {variant.sku}
                </option>
              ))}
            </select>
          </FormField>
          {selectedProductForLevel ? (
            <p className="text-xs text-[#6E6E6E]">
              Product base stock:{" "}
              <span className="font-medium">
                {normalizeStockQuantity(selectedProductForLevel.stock_quantity)} units
              </span>
            </p>
          ) : null}
          <FormField label="Location" required>
            <select
              className={fieldSelectClass}
              value={levelLocationId}
              onChange={(event) => setLevelLocationId(event.target.value)}
              required
            >
              <option value="">Select location</option>
              {locations.map((location: any) => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Available" required>
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={levelAvailable}
                onChange={(event) => setLevelAvailable(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Reserved">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={levelReserved}
                onChange={(event) => setLevelReserved(event.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Committed">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={levelCommitted}
                onChange={(event) => setLevelCommitted(event.target.value)}
              />
            </FormField>
            <FormField label="Safety Stock">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={levelSafetyStock}
                onChange={(event) => setLevelSafetyStock(event.target.value)}
              />
            </FormField>
          </div>
          <button className="btn-primary w-full" disabled={savingLevel}>
            {savingLevel ? "Saving..." : "Apply Stock Level"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#111]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Locations</h2>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">{locations.length} total</p>
          </div>
          {locations.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No inventory locations yet.</p>
          ) : (
            locations.map((location: any) => (
              <article key={location._id} className="border border-[#111]/10 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{location.name}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {location.city || "No city"} / {location.country || "No country"}
                    </p>
                  </div>
                  <button
                    className={`text-xs px-3 py-1 border ${
                      location.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[#111]/10 text-[#6E6E6E]"
                    }`}
                    disabled={busyKey === `location:${location._id}`}
                    onClick={async () => {
                      setBusyKey(`location:${location._id}`);
                      try {
                        await updateLocation({
                          id: location._id,
                          active: !location.active,
                        });
                        toast(location.active ? "Location disabled" : "Location enabled");
                      } catch (error: any) {
                        toast(error?.message ?? "Unable to update location", "error");
                      } finally {
                        setBusyKey(null);
                      }
                    }}
                  >
                    {location.active ? "Active" : "Inactive"}
                  </button>
                </div>
                <p className="text-xs text-[#6E6E6E]">
                  Key: {location.key} - {locationLevelCount.get(String(location._id)) ?? 0} level entries
                </p>
              </article>
            ))
          )}
        </section>

        <section className="bg-white border border-[#111]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Recent Variants</h2>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
              {recentVariants.length} shown
            </p>
          </div>
          {recentVariants.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No variants available.</p>
          ) : (
            recentVariants.map((variant: any) => (
              <article key={variant._id} className="border border-[#111]/10 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {variant.product_name} - {variant.sku}
                    </p>
                    <p className="text-xs text-[#6E6E6E]">
                      {variant.title || "Default variant"} -{" "}
                      {formatPrice(variant.effective_price ?? variant.price ?? 0)}
                    </p>
                  </div>
                  <button
                    className={`text-xs px-3 py-1 border ${
                      variant.in_stock
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                    disabled={busyKey === `variant:${variant._id}`}
                    onClick={async () => {
                      setBusyKey(`variant:${variant._id}`);
                      try {
                        await updateVariant({
                          id: variant._id,
                          in_stock: !variant.in_stock,
                        });
                        toast(variant.in_stock ? "Variant marked out of stock" : "Variant marked in stock");
                      } catch (error: any) {
                        toast(error?.message ?? "Unable to update variant", "error");
                      } finally {
                        setBusyKey(null);
                      }
                    }}
                  >
                    {variant.in_stock ? "In stock" : "Out of stock"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      <section className="bg-white border border-[#111]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg">Inventory Levels</h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="border border-[#111]/10 px-3 py-2 text-sm bg-white"
              value={levelSearch}
              onChange={(event) => setLevelSearch(event.target.value)}
              placeholder="Search product, SKU, title, location"
            />
            <select
              className="border border-[#111]/10 px-3 py-2 text-sm bg-white"
              value={levelLocationFilter}
              onChange={(event) => setLevelLocationFilter(event.target.value)}
            >
              <option value="">All locations</option>
              {locations.map((location: any) => (
                <option key={location._id} value={location._id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLevels.length === 0 ? (
          <p className="text-sm text-[#6E6E6E]">No stock levels match this filter.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#111]/10">
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3 text-right">Available</th>
                  <th className="py-2 pr-3 text-right">Reserved</th>
                  <th className="py-2 pr-3 text-right">Committed</th>
                  <th className="py-2 pr-3 text-right">Sellable</th>
                  <th className="py-2 pr-3 text-right">Safety</th>
                </tr>
              </thead>
              <tbody>
                {filteredLevels.map((row: any) => {
                  const isLow = row.sellable <= (row.safety_stock ?? 0);
                  return (
                    <tr key={row._id} className="border-b border-[#111]/10">
                      <td className="py-2 pr-3">{row.product_name || "-"}</td>
                      <td className="py-2 pr-3">
                        <div>
                          <p>{row.variant_sku || "-"}</p>
                          <p className="text-xs text-[#6E6E6E]">{row.variant_title || "Default"}</p>
                        </div>
                      </td>
                      <td className="py-2 pr-3">{row.location_name || "-"}</td>
                      <td className="py-2 pr-3 text-right">{row.available}</td>
                      <td className="py-2 pr-3 text-right">{row.reserved}</td>
                      <td className="py-2 pr-3 text-right">{row.committed}</td>
                      <td className={`py-2 pr-3 text-right ${isLow ? "text-red-600 font-medium" : ""}`}>
                        {row.sellable}
                      </td>
                      <td className="py-2 pr-3 text-right">{row.safety_stock ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
