import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";
import CheckoutShell from "./CheckoutShell";
import { shippingAddressSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";

export default function CheckoutShippingPage() {
  const navigate = useNavigate();
  const guestToken = useGuestToken();
  const cart = useQuery(
    api.cart.getCurrent,
    guestToken ? { guest_token: guestToken } : "skip"
  );
  const setAddress = useMutation(api.checkout.setAddress);
  const setShippingMethod = useMutation(api.checkout.setShippingMethod);

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const address = cart?.checkout_context?.shipping_address;
    if (!address) return;
    setLine1(address.line1 ?? "");
    setLine2(address.line2 ?? "");
    setCity(address.city ?? "");
    setState(address.state ?? "");
    setPostalCode(address.postal_code ?? "");
    setCountry(address.country ?? "Pakistan");
  }, [cart?.checkout_context?.shipping_address]);

  const quoteArgs = useMemo(() => {
    if (!guestToken) return "skip" as const;
    return {
      guest_token: guestToken,
      country: country || undefined,
      state: state || undefined,
      city: city || undefined,
    };
  }, [guestToken, country, state, city]);

  const quotes = useQuery(api.cart.estimateShipping, quoteArgs);

  useEffect(() => {
    if (!quotes || quotes.length === 0) return;
    if (!selectedMethod) {
      setSelectedMethod(quotes[0].shipping_method_id);
    }
  }, [quotes, selectedMethod]);

  if (!guestToken || cart === undefined) {
    return <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">Loading checkout...</div>;
  }

  if (!cart || (cart.items ?? []).length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F2EE] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-[#6E6E6E]">Your cart is empty.</p>
          <button className="btn-primary" onClick={() => navigate("/")}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutShell currentStep="shipping" cart={cart}>
      <form
        className="space-y-4 ecom-card p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          const parsed = shippingAddressSchema.safeParse({
            line1,
            line2: line2 || undefined,
            city,
            state: state || undefined,
            postal_code: postalCode || undefined,
            country,
          });
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Enter a valid shipping address");
            return;
          }
          if (!selectedMethod) {
            setError("Select a shipping method");
            return;
          }

          setSaving(true);
          try {
            await setAddress({
              cart_id: cart._id,
              guest_token: guestToken,
              shipping_address: parsed.data,
            });
            await setShippingMethod({
              cart_id: cart._id,
              guest_token: guestToken,
              shipping_method_id: selectedMethod as any,
            });
            navigate("/checkout/payment");
          } catch (err: any) {
            setError(err?.message ?? "Unable to save shipping details");
          } finally {
            setSaving(false);
          }
        }}
      >
        <h1 className="font-display text-2xl">Shipping Details</h1>
        <p className="text-sm text-[#6E6E6E]">
          Enter your delivery address exactly as your courier can verify it.
        </p>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            Address line 1
          </label>
          <input
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            className="w-full ecom-input px-3 py-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            Address line 2
          </label>
          <input
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            className="w-full ecom-input px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full ecom-input px-3 py-2"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
              State/Province
            </label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full ecom-input px-3 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
              Postal Code
            </label>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full ecom-input px-3 py-2"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Country</label>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full ecom-input px-3 py-2"
              required
            />
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[#111]/10">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Shipping Method</p>
          {quotes === undefined ? (
            <p className="text-sm text-[#6E6E6E]">Loading rates...</p>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-red-500">No shipping options for this address yet.</p>
          ) : (
            <div className="space-y-2">
              {quotes.map((quote) => (
                <label
                  key={quote.shipping_method_id}
                  className="flex items-center justify-between ecom-card p-3"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={quote.shipping_method_id}
                      checked={selectedMethod === quote.shipping_method_id}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                    />
                    <span className="text-sm">
                      {quote.label}
                      {quote.eta_min_days && quote.eta_max_days
                        ? ` (${quote.eta_min_days}-${quote.eta_max_days} days)`
                        : ""}
                    </span>
                  </span>
                  <span className="text-sm font-medium">{formatPrice(quote.amount)}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Continue to Payment"}
        </button>
        <p className="text-xs text-[#6E6E6E]">
          Delivery estimates update by city and shipping method.
        </p>
      </form>
    </CheckoutShell>
  );
}
