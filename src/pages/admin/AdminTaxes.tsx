import { useMemo, useState } from "react";
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

export default function AdminTaxes() {
  const config = useQuery(api.taxes.adminListConfig);
  const productsQuery = useQuery(api.products.list);
  const categoriesQuery = useQuery(api.categories.list);

  const createProfile = useMutation(api.taxes.adminCreateProfile);
  const updateProfile = useMutation(api.taxes.adminUpdateProfile);
  const createRule = useMutation(api.taxes.adminCreateRule);
  const updateRule = useMutation(api.taxes.adminUpdateRule);
  const { toast } = useToast();

  const [profileName, setProfileName] = useState("");
  const [profileCountry, setProfileCountry] = useState("PK");
  const [profileState, setProfileState] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileRate, setProfileRate] = useState("18");
  const [profileInclusive, setProfileInclusive] = useState(false);
  const [profileActive, setProfileActive] = useState(true);
  const [profilePriority, setProfilePriority] = useState("");
  const [creatingProfile, setCreatingProfile] = useState(false);

  const [ruleProfileId, setRuleProfileId] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");
  const [ruleProductId, setRuleProductId] = useState("");
  const [ruleActive, setRuleActive] = useState(true);
  const [creatingRule, setCreatingRule] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [simSubtotal, setSimSubtotal] = useState("5000");
  const [simShipping, setSimShipping] = useState("250");
  const [simCountry, setSimCountry] = useState("PK");
  const [simState, setSimState] = useState("Punjab");
  const [simCity, setSimCity] = useState("Lahore");

  const quote = useQuery(api.taxes.calculateForAddress, {
    subtotal: Number(simSubtotal || 0),
    shipping_total: Number(simShipping || 0),
    country: simCountry || undefined,
    state: simState || undefined,
    city: simCity || undefined,
  });

  const profiles = config?.profiles ?? [];
  const rules = config?.rules ?? [];
  const productNameById = useMemo(() => {
    return new Map((productsQuery ?? []).map((product: any) => [String(product._id), product.name]));
  }, [productsQuery]);

  const sortedCategories = useMemo(
    () => [...(categoriesQuery ?? [])].sort((a: any, b: any) => a.name.localeCompare(b.name)),
    [categoriesQuery]
  );
  const sortedProducts = useMemo(
    () => [...(productsQuery ?? [])].sort((a: any, b: any) => a.name.localeCompare(b.name)),
    [productsQuery]
  );

  const handleCreateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const rate = parseOptionalNumber(profileRate);
    const priority = parseOptionalNumber(profilePriority);
    if (!profileName.trim()) {
      toast("Profile name is required", "error");
      return;
    }
    if (!profileCountry.trim()) {
      toast("Country code is required", "error");
      return;
    }
    if (rate === undefined || rate < 0) {
      toast("Enter a valid tax rate", "error");
      return;
    }

    setCreatingProfile(true);
    try {
      await createProfile({
        name: profileName.trim(),
        country_code: profileCountry.trim().toUpperCase(),
        state_code: profileState.trim() || undefined,
        city: profileCity.trim() || undefined,
        rate,
        inclusive: profileInclusive,
        active: profileActive,
        priority,
      });
      setProfileName("");
      setProfileState("");
      setProfileCity("");
      setProfileRate("18");
      setProfileInclusive(false);
      setProfileActive(true);
      setProfilePriority("");
      toast("Tax profile created");
    } catch (error: any) {
      toast(error?.message ?? "Unable to create profile", "error");
    } finally {
      setCreatingProfile(false);
    }
  };

  const handleCreateRule = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ruleProfileId) {
      toast("Select a tax profile", "error");
      return;
    }
    setCreatingRule(true);
    try {
      await createRule({
        tax_profile_id: ruleProfileId as any,
        product_category: ruleCategory || undefined,
        product_id: ruleProductId ? (ruleProductId as any) : undefined,
        active: ruleActive,
      });
      setRuleCategory("");
      setRuleProductId("");
      setRuleActive(true);
      toast("Tax rule created");
    } catch (error: any) {
      toast(error?.message ?? "Unable to create rule", "error");
    } finally {
      setCreatingRule(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form className="bg-white border border-[#111]/10 p-6 space-y-3" onSubmit={handleCreateProfile}>
          <h2 className="font-display text-xl">Create Tax Profile</h2>
          <FormField label="Name" required>
            <input
              className={fieldInputClass}
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              required
            />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Country Code" required hint="Example: PK">
              <input
                className={fieldInputClass}
                value={profileCountry}
                onChange={(event) => setProfileCountry(event.target.value)}
                required
              />
            </FormField>
            <FormField label="Tax Rate (%)" required>
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                step={0.01}
                value={profileRate}
                onChange={(event) => setProfileRate(event.target.value)}
                required
              />
            </FormField>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FormField label="State">
              <input
                className={fieldInputClass}
                value={profileState}
                onChange={(event) => setProfileState(event.target.value)}
              />
            </FormField>
            <FormField label="City">
              <input
                className={fieldInputClass}
                value={profileCity}
                onChange={(event) => setProfileCity(event.target.value)}
              />
            </FormField>
            <FormField label="Priority">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={profilePriority}
                onChange={(event) => setProfilePriority(event.target.value)}
                placeholder="Auto if blank"
              />
            </FormField>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="text-xs uppercase tracking-widest flex items-center gap-2">
              <input
                type="checkbox"
                checked={profileInclusive}
                onChange={(event) => setProfileInclusive(event.target.checked)}
              />
              Inclusive
            </label>
            <label className="text-xs uppercase tracking-widest flex items-center gap-2">
              <input
                type="checkbox"
                checked={profileActive}
                onChange={(event) => setProfileActive(event.target.checked)}
              />
              Active
            </label>
          </div>
          <button className="btn-primary w-full" disabled={creatingProfile}>
            {creatingProfile ? "Creating..." : "Create Profile"}
          </button>
        </form>

        <form className="bg-white border border-[#111]/10 p-6 space-y-3" onSubmit={handleCreateRule}>
          <h2 className="font-display text-xl">Create Tax Rule</h2>
          <FormField label="Tax Profile" required>
            <select
              className={fieldSelectClass}
              value={ruleProfileId}
              onChange={(event) => setRuleProfileId(event.target.value)}
              required
            >
              <option value="">Select profile</option>
              {profiles.map((profile: any) => (
                <option key={profile._id} value={profile._id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Category">
            <select
              className={fieldSelectClass}
              value={ruleCategory}
              onChange={(event) => setRuleCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {sortedCategories.map((category: any) => (
                <option key={category._id} value={category.slug || category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Product">
            <select
              className={fieldSelectClass}
              value={ruleProductId}
              onChange={(event) => setRuleProductId(event.target.value)}
            >
              <option value="">All products</option>
              {sortedProducts.map((product: any) => (
                <option key={product._id} value={product._id}>
                  {product.name}
                </option>
              ))}
            </select>
          </FormField>

          <label className="text-xs uppercase tracking-widest flex items-center gap-2">
            <input
              type="checkbox"
              checked={ruleActive}
              onChange={(event) => setRuleActive(event.target.checked)}
            />
            Active
          </label>

          <button className="btn-primary w-full" disabled={creatingRule}>
            {creatingRule ? "Creating..." : "Create Rule"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#111]/10 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Tax Profiles</h2>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">{profiles.length} total</p>
          </div>
          {profiles.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No tax profiles configured.</p>
          ) : (
            profiles.map((profile: any) => (
              <article key={profile._id} className="border border-[#111]/10 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {profile.name} ({profile.country_code})
                    </p>
                    <p className="text-xs text-[#6E6E6E]">
                      {profile.state_code || "All states"} / {profile.city || "All cities"} /{" "}
                      {profile.rate}%
                    </p>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-[#6E6E6E]">
                    Priority {profile.priority}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#111]/10">
                  <button
                    className={`text-xs px-3 py-1 border ${
                      profile.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[#111]/10 text-[#6E6E6E]"
                    }`}
                    disabled={busyKey === `profile:${profile._id}:active`}
                    onClick={async () => {
                      setBusyKey(`profile:${profile._id}:active`);
                      try {
                        await updateProfile({
                          id: profile._id,
                          active: !profile.active,
                        });
                        toast(profile.active ? "Profile disabled" : "Profile enabled");
                      } catch (error: any) {
                        toast(error?.message ?? "Unable to update profile", "error");
                      } finally {
                        setBusyKey(null);
                      }
                    }}
                  >
                    {profile.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    className={`text-xs px-3 py-1 border ${
                      profile.inclusive
                        ? "border-[#111] bg-[#111] text-white"
                        : "border-[#111]/10 text-[#6E6E6E]"
                    }`}
                    disabled={busyKey === `profile:${profile._id}:inclusive`}
                    onClick={async () => {
                      setBusyKey(`profile:${profile._id}:inclusive`);
                      try {
                        await updateProfile({
                          id: profile._id,
                          inclusive: !profile.inclusive,
                        });
                        toast(
                          !profile.inclusive
                            ? "Profile set to inclusive tax"
                            : "Profile set to additive tax"
                        );
                      } catch (error: any) {
                        toast(error?.message ?? "Unable to update profile", "error");
                      } finally {
                        setBusyKey(null);
                      }
                    }}
                  >
                    {profile.inclusive ? "Inclusive" : "Additive"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="bg-white border border-[#111]/10 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Tax Rules</h2>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">{rules.length} total</p>
          </div>
          {rules.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No tax rules configured.</p>
          ) : (
            rules.map((rule: any) => {
              const productName = rule.product_id
                ? productNameById.get(String(rule.product_id)) || "Unknown product"
                : "";
              const target = productName || rule.product_category || "All products";
              return (
                <article key={rule._id} className="border border-[#111]/10 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{rule.profile_name || "Tax Profile"}</p>
                      <p className="text-xs text-[#6E6E6E]">Target: {target}</p>
                    </div>
                    <button
                      className={`text-xs px-3 py-1 border ${
                        rule.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-[#111]/10 text-[#6E6E6E]"
                      }`}
                      disabled={busyKey === `rule:${rule._id}`}
                      onClick={async () => {
                        setBusyKey(`rule:${rule._id}`);
                        try {
                          await updateRule({
                            id: rule._id,
                            active: !rule.active,
                          });
                          toast(rule.active ? "Rule disabled" : "Rule enabled");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to update rule", "error");
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                    >
                      {rule.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>

      <section className="bg-white border border-[#111]/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg">Tax Simulator</h2>
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            Destination-aware estimate
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <FormField label="Subtotal">
            <input
              className={fieldInputClass}
              type="number"
              min={0}
              value={simSubtotal}
              onChange={(event) => setSimSubtotal(event.target.value)}
            />
          </FormField>
          <FormField label="Shipping">
            <input
              className={fieldInputClass}
              type="number"
              min={0}
              value={simShipping}
              onChange={(event) => setSimShipping(event.target.value)}
            />
          </FormField>
          <FormField label="Country">
            <input
              className={fieldInputClass}
              value={simCountry}
              onChange={(event) => setSimCountry(event.target.value)}
            />
          </FormField>
          <FormField label="State">
            <input
              className={fieldInputClass}
              value={simState}
              onChange={(event) => setSimState(event.target.value)}
            />
          </FormField>
          <FormField label="City">
            <input
              className={fieldInputClass}
              value={simCity}
              onChange={(event) => setSimCity(event.target.value)}
            />
          </FormField>
        </div>

        {!quote ? (
          <p className="text-sm text-[#6E6E6E]">Calculating tax estimate...</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-[#111]/10 p-3">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Tax Base</p>
                <p className="font-display text-lg">{formatPrice(quote.base)}</p>
              </div>
              <div className="border border-[#111]/10 p-3">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Additive Tax</p>
                <p className="font-display text-lg">{formatPrice(quote.additive_tax_total)}</p>
              </div>
              <div className="border border-[#111]/10 p-3">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Display Tax</p>
                <p className="font-display text-lg">{formatPrice(quote.total_tax_display)}</p>
              </div>
            </div>
            {quote.applied_profiles.length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No active profile matched this destination.</p>
            ) : (
              <div className="space-y-2">
                {quote.applied_profiles.map((applied) => (
                  <div
                    key={String(applied.tax_profile_id)}
                    className="border border-[#111]/10 p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{applied.name}</p>
                      <p className="text-xs text-[#6E6E6E]">
                        {applied.rate}% - {applied.inclusive ? "inclusive" : "additive"}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatPrice(applied.amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
