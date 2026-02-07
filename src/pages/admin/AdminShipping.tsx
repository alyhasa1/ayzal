
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormField, { fieldInputClass, fieldSelectClass } from "@/components/admin/FormField";
import { useToast } from "@/components/admin/Toast";
import { formatPrice } from "@/lib/format";

type CoverageScope = "country" | "state" | "city";
type MethodPresetKey = "standard" | "express" | "same_day" | "custom";

const COUNTRY_OPTIONS = [
  "Pakistan",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "India",
  "Bangladesh",
];

const PAKISTAN_PROVINCES = [
  "Punjab",
  "Sindh",
  "Balochistan",
  "KPK",
  "Gilgit Baltistan (GB)",
];

const PAKISTAN_CITIES_BY_PROVINCE: Record<string, string[]> = {
  Punjab: ["Lahore", "Rawalpindi", "Faisalabad", "Multan", "Gujranwala", "Sialkot"],
  Sindh: ["Karachi", "Hyderabad", "Sukkur", "Larkana"],
  Balochistan: ["Quetta", "Gwadar", "Khuzdar", "Turbat"],
  KPK: ["Peshawar", "Mardan", "Abbottabad", "Swat"],
  "Gilgit Baltistan (GB)": ["Gilgit", "Skardu", "Hunza"],
};

const METHOD_PRESETS: Array<{
  key: MethodPresetKey;
  label: string;
  methodKey: string;
  methodLabel: string;
  etaMin?: number;
  etaMax?: number;
}> = [
  {
    key: "standard",
    label: "Standard Delivery",
    methodKey: "standard",
    methodLabel: "Standard Delivery",
    etaMin: 3,
    etaMax: 6,
  },
  {
    key: "express",
    label: "Express Delivery",
    methodKey: "express",
    methodLabel: "Express Delivery",
    etaMin: 1,
    etaMax: 2,
  },
  {
    key: "same_day",
    label: "Same Day Delivery",
    methodKey: "same_day",
    methodLabel: "Same Day Delivery",
    etaMin: 0,
    etaMax: 1,
  },
  {
    key: "custom",
    label: "Custom Method",
    methodKey: "",
    methodLabel: "",
  },
];

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function normalizeList(values?: string[]) {
  return [...(values ?? [])]
    .map(normalizeToken)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function sameNormalizedList(a?: string[], b?: string[]) {
  const left = normalizeList(a);
  const right = normalizeList(b);
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function slugifyMethodKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
}

function optionalNullableNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function rangeLabel(rate: any) {
  if (rate.min_subtotal === undefined && rate.max_subtotal === undefined) {
    return "All order totals";
  }
  if (rate.min_subtotal === undefined) {
    return `Up to ${formatPrice(rate.max_subtotal)}`;
  }
  if (rate.max_subtotal === undefined) {
    return `${formatPrice(rate.min_subtotal)} and above`;
  }
  return `${formatPrice(rate.min_subtotal)} to ${formatPrice(rate.max_subtotal)}`;
}

export default function AdminShipping() {
  const config = useQuery(api.shipping.adminListConfig);
  const createZone = useMutation(api.shipping.adminCreateZone);
  const updateZone = useMutation(api.shipping.adminUpdateZone);
  const createMethod = useMutation(api.shipping.adminCreateMethod);
  const updateMethod = useMutation(api.shipping.adminUpdateMethod);
  const createRate = useMutation(api.shipping.adminCreateRate);
  const updateRate = useMutation(api.shipping.adminUpdateRate);
  const deleteRate = useMutation(api.shipping.adminDeleteRate);
  const { toast } = useToast();

  const zones = config?.zones;
  const methods = config?.methods;
  const rates = config?.rates;
  const zoneList = zones ?? [];
  const methodList = methods ?? [];

  const [country, setCountry] = useState("Pakistan");
  const [scope, setScope] = useState<CoverageScope>("country");
  const [province, setProvince] = useState("Punjab");
  const [city, setCity] = useState("Lahore");
  const [customState, setCustomState] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [methodPreset, setMethodPreset] = useState<MethodPresetKey>("standard");
  const [customMethodLabel, setCustomMethodLabel] = useState("");
  const [customMethodKey, setCustomMethodKey] = useState("");
  const [carrier, setCarrier] = useState("TCS");
  const [flatRate, setFlatRate] = useState("250");
  const [freeOver, setFreeOver] = useState("");
  const [etaMin, setEtaMin] = useState("3");
  const [etaMax, setEtaMax] = useState("6");
  const [savingQuickRule, setSavingQuickRule] = useState(false);

  const [rateMethodId, setRateMethodId] = useState("");
  const [rateMinSubtotal, setRateMinSubtotal] = useState("");
  const [rateMaxSubtotal, setRateMaxSubtotal] = useState("");
  const [rateCharge, setRateCharge] = useState("");
  const [savingRate, setSavingRate] = useState(false);

  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateMethodId, setEditRateMethodId] = useState("");
  const [editRateMinSubtotal, setEditRateMinSubtotal] = useState("");
  const [editRateMaxSubtotal, setEditRateMaxSubtotal] = useState("");
  const [editRateCharge, setEditRateCharge] = useState("");
  const [busyRateId, setBusyRateId] = useState<string | null>(null);

  const [simSubtotal, setSimSubtotal] = useState("5000");
  const [simCountry, setSimCountry] = useState("Pakistan");
  const [simState, setSimState] = useState("Punjab");
  const [simCity, setSimCity] = useState("Lahore");

  const isPakistan = country === "Pakistan";
  const provinceOptions = isPakistan ? PAKISTAN_PROVINCES : [];
  const cityOptions = isPakistan ? PAKISTAN_CITIES_BY_PROVINCE[province] ?? [] : [];

  const activePreset =
    METHOD_PRESETS.find((preset) => preset.key === methodPreset) ?? METHOD_PRESETS[0];

  const quotes = useQuery(api.shipping.quoteRates, {
    subtotal: Number(simSubtotal || 0),
    country: simCountry || undefined,
    state: simState || undefined,
    city: simCity || undefined,
  });

  const methodsByZone = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const method of methods ?? []) {
      const key = method.zone_id ? String(method.zone_id) : "__global__";
      const list = map.get(key) ?? [];
      list.push(method);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [methods]);

  const sortedRates = useMemo(
    () =>
      [...(rates ?? [])].sort((a: any, b: any) =>
        (a.method_label || "").localeCompare(b.method_label || "")
      ),
    [rates]
  );

  const startRateEdit = (rate: any) => {
    setEditingRateId(String(rate._id));
    setEditRateMethodId(String(rate.method_id));
    setEditRateMinSubtotal(rate.min_subtotal !== undefined ? String(rate.min_subtotal) : "");
    setEditRateMaxSubtotal(rate.max_subtotal !== undefined ? String(rate.max_subtotal) : "");
    setEditRateCharge(String(rate.rate));
  };

  const cancelRateEdit = () => {
    setEditingRateId(null);
    setEditRateMethodId("");
    setEditRateMinSubtotal("");
    setEditRateMaxSubtotal("");
    setEditRateCharge("");
  };

  const resolveLocation = () => {
    const stateValue = isPakistan ? province : customState.trim();
    const cityValue = isPakistan ? city : customCity.trim();
    return { stateValue, cityValue };
  };

  const resolveMethodIdentity = () => {
    if (methodPreset !== "custom") {
      return {
        key: activePreset.methodKey,
        label: activePreset.methodLabel,
      };
    }
    return {
      key: slugifyMethodKey(customMethodKey || customMethodLabel),
      label: customMethodLabel.trim(),
    };
  };

  const handleQuickSetup = async (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(flatRate);
    const freeThreshold = optionalNumber(freeOver);
    const minEta = optionalNumber(etaMin);
    const maxEta = optionalNumber(etaMax);

    if (!country.trim()) {
      toast("Select a country", "error");
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      toast("Enter a valid flat shipping rate", "error");
      return;
    }
    if (minEta !== undefined && minEta < 0) {
      toast("ETA min must be zero or greater", "error");
      return;
    }
    if (maxEta !== undefined && maxEta < 0) {
      toast("ETA max must be zero or greater", "error");
      return;
    }
    if (minEta !== undefined && maxEta !== undefined && maxEta < minEta) {
      toast("ETA max must be greater than or equal to ETA min", "error");
      return;
    }

    const { stateValue, cityValue } = resolveLocation();
    if (scope !== "country" && !stateValue) {
      toast("Select a state/province", "error");
      return;
    }
    if (scope === "city" && !cityValue) {
      toast("Select a city", "error");
      return;
    }

    const methodIdentity = resolveMethodIdentity();
    if (!methodIdentity.key || !methodIdentity.label) {
      toast("Shipping method label and key are required", "error");
      return;
    }

    const countryCodes = [country];
    const stateCodes = scope === "country" ? undefined : [stateValue];
    const cityPatterns = scope === "city" ? [cityValue.toLowerCase()] : undefined;

    let zoneName = `${country} - Nationwide`;
    if (scope === "state") zoneName = `${country} - ${stateValue}`;
    if (scope === "city") zoneName = `${country} - ${stateValue} - ${cityValue}`;

    setSavingQuickRule(true);
    try {
      const existingZone = zoneList.find(
        (zone: any) =>
          sameNormalizedList(zone.country_codes, countryCodes) &&
          sameNormalizedList(zone.state_codes, stateCodes) &&
          sameNormalizedList(zone.city_patterns, cityPatterns)
      );

      let zoneId: any = existingZone?._id;
      if (!existingZone) {
        zoneId = await createZone({
          name: zoneName,
          country_codes: countryCodes,
          state_codes: stateCodes,
          city_patterns: cityPatterns,
          active: true,
        });
      } else if (!existingZone.active || existingZone.name !== zoneName) {
        await updateZone({
          id: existingZone._id,
          active: true,
          name: zoneName,
          country_codes: countryCodes,
          state_codes: stateCodes,
          city_patterns: cityPatterns,
        });
      }

      const methodKeyNorm = normalizeToken(methodIdentity.key);
      const existingMethod = methodList.find(
        (method: any) =>
          String(method.zone_id ?? "") === String(zoneId ?? "") &&
          normalizeToken(method.key ?? "") === methodKeyNorm
      );

      const methodPayload = {
        zone_id: zoneId,
        key: methodIdentity.key,
        label: methodIdentity.label,
        description:
          scope === "country"
            ? `${methodIdentity.label} across all ${country}`
            : scope === "state"
              ? `${methodIdentity.label} for ${stateValue}, ${country}`
              : `${methodIdentity.label} for ${cityValue}, ${stateValue}`,
        carrier: carrier.trim() || undefined,
        eta_min_days: minEta,
        eta_max_days: maxEta,
        flat_rate: amount,
        free_over: freeThreshold,
        active: true,
      };

      if (existingMethod) {
        await updateMethod({
          id: existingMethod._id,
          ...methodPayload,
        });
      } else {
        await createMethod(methodPayload);
      }

      toast("Shipping rule saved");
    } catch (error: any) {
      toast(error?.message ?? "Unable to save shipping rule", "error");
    } finally {
      setSavingQuickRule(false);
    }
  };

  const handleCreateRate = async (event: React.FormEvent) => {
    event.preventDefault();
    const minSubtotal = optionalNumber(rateMinSubtotal);
    const maxSubtotal = optionalNumber(rateMaxSubtotal);
    const charge = Number(rateCharge);

    if (!rateMethodId) return toast("Select a shipping method", "error");
    if (!Number.isFinite(charge) || charge < 0) {
      return toast("Enter a valid rate charge", "error");
    }
    if (
      minSubtotal !== undefined &&
      maxSubtotal !== undefined &&
      maxSubtotal < minSubtotal
    ) {
      return toast("Max subtotal must be greater than min subtotal", "error");
    }

    setSavingRate(true);
    try {
      await createRate({
        method_id: rateMethodId as any,
        min_subtotal: minSubtotal,
        max_subtotal: maxSubtotal,
        rate: charge,
        currency: "PKR",
        active: true,
      });
      setRateMethodId("");
      setRateMinSubtotal("");
      setRateMaxSubtotal("");
      setRateCharge("");
      toast("Rate rule created");
    } catch (error: any) {
      toast(error?.message ?? "Unable to create rate", "error");
    } finally {
      setSavingRate(false);
    }
  };

  const handleSaveRate = async (rateId: string) => {
    const minSubtotal = optionalNullableNumber(editRateMinSubtotal);
    const maxSubtotal = optionalNullableNumber(editRateMaxSubtotal);
    const charge = Number(editRateCharge);

    if (!editRateMethodId) return toast("Select a method", "error");
    if (!Number.isFinite(charge) || charge < 0) {
      return toast("Enter a valid rate charge", "error");
    }
    if (minSubtotal !== null && maxSubtotal !== null && maxSubtotal < minSubtotal) {
      return toast("Max subtotal must be greater than min subtotal", "error");
    }

    setBusyRateId(rateId);
    try {
      await updateRate({
        id: rateId as any,
        method_id: editRateMethodId as any,
        min_subtotal: minSubtotal,
        max_subtotal: maxSubtotal,
        rate: charge,
        currency: "PKR",
      });
      cancelRateEdit();
      toast("Rate updated");
    } catch (error: any) {
      toast(error?.message ?? "Unable to update rate", "error");
    } finally {
      setBusyRateId(null);
    }
  };

  const handleToggleRate = async (rate: any) => {
    const rateId = String(rate._id);
    setBusyRateId(rateId);
    try {
      await updateRate({ id: rate._id, active: !rate.active });
      toast(rate.active ? "Rate disabled" : "Rate enabled");
    } catch (error: any) {
      toast(error?.message ?? "Unable to update rate", "error");
    } finally {
      setBusyRateId(null);
    }
  };

  const handleDeleteRate = async (rate: any) => {
    const confirmed = window.confirm("Delete this rate rule? This cannot be undone.");
    if (!confirmed) return;
    const rateId = String(rate._id);
    setBusyRateId(rateId);
    try {
      await deleteRate({ id: rate._id });
      if (editingRateId === rateId) cancelRateEdit();
      toast("Rate deleted");
    } catch (error: any) {
      toast(error?.message ?? "Unable to delete rate", "error");
    } finally {
      setBusyRateId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#F7F3ED] border border-[#111]/10 p-4 text-sm text-[#4A4A4A]">
        <p className="font-medium text-[#111] mb-1">Simple Shipping Setup</p>
        <p>
          Choose country and coverage (nationwide, province, city), set one flat rate, and save.
          This creates or updates the correct zone and method automatically.
        </p>
      </div>

      <form className="bg-white border border-[#111]/10 p-6 space-y-4" onSubmit={handleQuickSetup}>
        <h2 className="font-display text-xl">Quick Shipping Rule</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <FormField label="Country" required hint="Select the country where this rule applies.">
            <select
              className={fieldSelectClass}
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              required
            >
              {COUNTRY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Coverage" required hint="Nationwide means all states and cities.">
            <select
              className={fieldSelectClass}
              value={scope}
              onChange={(event) => setScope(event.target.value as CoverageScope)}
              required
            >
              <option value="country">Nationwide (All states and cities)</option>
              <option value="state">Specific Province/State</option>
              <option value="city">Specific City in a Province/State</option>
            </select>
          </FormField>

          {scope !== "country" ? (
            isPakistan ? (
              <FormField label="Province/State" required>
                <select
                  className={fieldSelectClass}
                  value={province}
                  onChange={(event) => {
                    setProvince(event.target.value);
                    const firstCity = PAKISTAN_CITIES_BY_PROVINCE[event.target.value]?.[0] ?? "";
                    setCity(firstCity);
                  }}
                  required
                >
                  {provinceOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <FormField label="Province/State" required>
                <input
                  className={fieldInputClass}
                  value={customState}
                  onChange={(event) => setCustomState(event.target.value)}
                  placeholder="California"
                  required
                />
              </FormField>
            )
          ) : (
            <div />
          )}

          {scope === "city" ? (
            isPakistan ? (
              <FormField label="City" required hint="Curated city list for selected province.">
                <select
                  className={fieldSelectClass}
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  required
                >
                  {cityOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <FormField label="City" required>
                <input
                  className={fieldInputClass}
                  value={customCity}
                  onChange={(event) => setCustomCity(event.target.value)}
                  placeholder="Los Angeles"
                  required
                />
              </FormField>
            )
          ) : (
            <div />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <FormField label="Method Type" required>
            <select
              className={fieldSelectClass}
              value={methodPreset}
              onChange={(event) => setMethodPreset(event.target.value as MethodPresetKey)}
              required
            >
              {METHOD_PRESETS.map((preset) => (
                <option key={preset.key} value={preset.key}>
                  {preset.label}
                </option>
              ))}
            </select>
          </FormField>

          {methodPreset === "custom" ? (
            <>
              <FormField label="Custom Method Label" required>
                <input
                  className={fieldInputClass}
                  value={customMethodLabel}
                  onChange={(event) => setCustomMethodLabel(event.target.value)}
                  placeholder="Weekend Delivery"
                  required
                />
              </FormField>
              <FormField
                label="Custom Method Key"
                required
                hint="System key, lowercase with underscores."
              >
                <input
                  className={fieldInputClass}
                  value={customMethodKey}
                  onChange={(event) => setCustomMethodKey(event.target.value)}
                  placeholder="weekend_delivery"
                  required
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField label="Method Label">
                <input className={fieldInputClass} value={activePreset.methodLabel} disabled />
              </FormField>
              <FormField label="Method Key">
                <input className={fieldInputClass} value={activePreset.methodKey} disabled />
              </FormField>
            </>
          )}

          <FormField label="Courier (Optional)">
            <input
              className={fieldInputClass}
              value={carrier}
              onChange={(event) => setCarrier(event.target.value)}
              placeholder="TCS"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <FormField label="Flat Shipping Rate (PKR)" required>
            <input
              className={fieldInputClass}
              type="number"
              min={0}
              value={flatRate}
              onChange={(event) => setFlatRate(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Free Shipping Over (PKR)" hint="Leave blank if not needed.">
            <input
              className={fieldInputClass}
              type="number"
              min={0}
              value={freeOver}
              onChange={(event) => setFreeOver(event.target.value)}
            />
          </FormField>
          <FormField label="ETA Min (Days)" hint="Lowest delivery estimate.">
            <input
              className={fieldInputClass}
              type="number"
              min={0}
              value={etaMin}
              onChange={(event) => setEtaMin(event.target.value)}
            />
          </FormField>
          <FormField label="ETA Max (Days)" hint="Highest delivery estimate.">
            <input
              className={fieldInputClass}
              type="number"
              min={0}
              value={etaMax}
              onChange={(event) => setEtaMax(event.target.value)}
            />
          </FormField>
        </div>

        <button className="btn-primary w-full md:w-auto px-8" type="submit" disabled={savingQuickRule}>
          {savingQuickRule ? "Saving..." : "Save Shipping Rule"}
        </button>
      </form>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-[#111]/10 p-5 space-y-4">
          <h2 className="font-display text-lg">Current Zones and Methods</h2>
          {zoneList.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No zones configured yet.</p>
          ) : (
            <div className="space-y-3">
              {zoneList.map((zone: any) => (
                <div key={zone._id} className="border border-[#111]/10 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{zone.name}</p>
                    <button
                      type="button"
                      className={`text-xs px-2.5 py-1 border ${
                        zone.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-[#111]/10 text-[#6E6E6E]"
                      }`}
                      onClick={async () => {
                        try {
                          await updateZone({ id: zone._id, active: !zone.active });
                          toast(zone.active ? "Zone disabled" : "Zone enabled");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to update zone", "error");
                        }
                      }}
                    >
                      {zone.active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <p className="text-xs text-[#6E6E6E]">
                    Countries: {zone.country_codes.join(", ")}
                    {zone.state_codes?.length ? ` | States: ${zone.state_codes.join(", ")}` : ""}
                    {zone.city_patterns?.length ? ` | Cities: ${zone.city_patterns.join(", ")}` : ""}
                  </p>
                  <div className="space-y-1">
                    {(methodsByZone.get(String(zone._id)) ?? []).map((method: any) => (
                      <div
                        key={method._id}
                        className="flex items-center justify-between text-xs border border-[#111]/10 p-2 gap-3"
                      >
                        <p>
                          {method.label} ({method.key}) | {formatPrice(method.flat_rate ?? 0)}
                        </p>
                        <button
                          type="button"
                          className={`px-2 py-0.5 border ${
                            method.active
                              ? "border-emerald-200 text-emerald-700"
                              : "border-[#111]/10 text-[#6E6E6E]"
                          }`}
                          onClick={async () => {
                            try {
                              await updateMethod({ id: method._id, active: !method.active });
                              toast(method.active ? "Method disabled" : "Method enabled");
                            } catch (error: any) {
                              toast(error?.message ?? "Unable to update method", "error");
                            }
                          }}
                        >
                          {method.active ? "Active" : "Inactive"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#111]/10 p-5 space-y-4">
          <h2 className="font-display text-lg">Rate Simulator</h2>
          <p className="text-xs text-[#6E6E6E]">
            Check which shipping methods customers will see for an address.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Subtotal (PKR)">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={simSubtotal}
                onChange={(event) => setSimSubtotal(event.target.value)}
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

          {quotes === undefined ? (
            <p className="text-sm text-[#6E6E6E]">Calculating shipping quotes...</p>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-red-500">No shipping methods matched this location.</p>
          ) : (
            <div className="space-y-2">
              {quotes.map((quote: any) => (
                <div key={quote.method_id} className="border border-[#111]/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{quote.label}</p>
                      <p className="text-xs text-[#6E6E6E]">
                        {quote.carrier ?? "No carrier"}
                        {quote.eta_min_days && quote.eta_max_days
                          ? ` | ${quote.eta_min_days}-${quote.eta_max_days} days`
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium">{formatPrice(quote.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <details className="bg-white border border-[#111]/10 p-5" open={false}>
        <summary className="font-display text-lg cursor-pointer select-none">
          Advanced Subtotal-Based Rate Rules (Optional)
        </summary>
        <div className="pt-4 space-y-4">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleCreateRate}>
            <FormField label="Method" required>
              <select
                className={fieldSelectClass}
                value={rateMethodId}
                onChange={(event) => setRateMethodId(event.target.value)}
                required
              >
                <option value="">Select method</option>
                {methodList.map((method: any) => (
                  <option key={method._id} value={method._id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Subtotal Min (PKR)">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={rateMinSubtotal}
                onChange={(event) => setRateMinSubtotal(event.target.value)}
              />
            </FormField>
            <FormField label="Subtotal Max (PKR)">
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={rateMaxSubtotal}
                onChange={(event) => setRateMaxSubtotal(event.target.value)}
              />
            </FormField>
            <FormField label="Charge (PKR)" required>
              <input
                className={fieldInputClass}
                type="number"
                min={0}
                value={rateCharge}
                onChange={(event) => setRateCharge(event.target.value)}
                required
              />
            </FormField>
            <button className="btn-primary md:col-span-4 w-full md:w-auto" disabled={savingRate}>
              {savingRate ? "Saving..." : "Create Advanced Rate Rule"}
            </button>
          </form>

          <div className="space-y-3">
            {sortedRates.length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No advanced rate rules configured.</p>
            ) : (
              sortedRates.map((rate: any) => {
                const rateId = String(rate._id);
                const isEditing = editingRateId === rateId;
                const isBusy = busyRateId === rateId;
                return (
                  <div key={rate._id} className="border border-[#111]/10 p-3 space-y-2">
                    {!isEditing ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{rate.method_label || "Method"}</p>
                          <p className="text-xs text-[#6E6E6E]">
                            {rangeLabel(rate)} | {formatPrice(rate.rate)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn-secondary text-xs px-3 py-2"
                            onClick={() => startRateEdit(rate)}
                            disabled={isBusy}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={`text-xs px-3 py-2 border ${
                              rate.active
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-[#111]/10 text-[#6E6E6E]"
                            }`}
                            onClick={() => handleToggleRate(rate)}
                            disabled={isBusy}
                          >
                            {rate.active ? "Active" : "Inactive"}
                          </button>
                          <button
                            type="button"
                            className="text-xs px-3 py-2 border border-red-200 text-red-600"
                            onClick={() => handleDeleteRate(rate)}
                            disabled={isBusy}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <FormField label="Method">
                          <select
                            className={fieldSelectClass}
                            value={editRateMethodId}
                            onChange={(event) => setEditRateMethodId(event.target.value)}
                          >
                            {methodList.map((method: any) => (
                              <option key={method._id} value={method._id}>
                                {method.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <FormField label="Subtotal Min (PKR)">
                          <input
                            className={fieldInputClass}
                            type="number"
                            min={0}
                            value={editRateMinSubtotal}
                            onChange={(event) => setEditRateMinSubtotal(event.target.value)}
                          />
                        </FormField>
                        <FormField label="Subtotal Max (PKR)">
                          <input
                            className={fieldInputClass}
                            type="number"
                            min={0}
                            value={editRateMaxSubtotal}
                            onChange={(event) => setEditRateMaxSubtotal(event.target.value)}
                          />
                        </FormField>
                        <FormField label="Charge (PKR)">
                          <input
                            className={fieldInputClass}
                            type="number"
                            min={0}
                            value={editRateCharge}
                            onChange={(event) => setEditRateCharge(event.target.value)}
                          />
                        </FormField>
                        <div className="md:col-span-4 flex gap-2">
                          <button
                            type="button"
                            className="btn-primary text-xs px-4 py-2"
                            onClick={() => handleSaveRate(rateId)}
                            disabled={isBusy}
                          >
                            {isBusy ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary text-xs px-4 py-2"
                            onClick={cancelRateEdit}
                            disabled={isBusy}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
