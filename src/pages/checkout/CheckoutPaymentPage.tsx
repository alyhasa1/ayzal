import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";
import CheckoutShell from "./CheckoutShell";
import { promoCodeSchema } from "@/lib/validation";
import { formatPrice } from "@/lib/format";
import BrandLoader from "@/components/BrandLoader";

export default function CheckoutPaymentPage() {
  const navigate = useNavigate();
  const guestToken = useGuestToken();
  const cart = useQuery(
    api.cart.getCurrent,
    guestToken ? { guest_token: guestToken } : "skip"
  );
  const paymentMethods = useQuery(api.paymentMethods.list) ?? [];
  const setPaymentMethod = useMutation(api.checkout.setPaymentMethod);
  const applyCode = useMutation(api.cart.applyCode);
  const clearCode = useMutation(api.cart.clearCode);

  const [selectedMethod, setSelectedMethod] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [applyingCode, setApplyingCode] = useState(false);

  useEffect(() => {
    if (!cart) return;
    setSelectedMethod(cart.payment_method_id ?? "");
    setPromoCode(cart.applied_code ?? "");
    if (cart.applied_code && (cart.discount_total ?? 0) > 0) {
      setPromoSuccess(`Applied ${cart.applied_code} - saved ${formatPrice(cart.discount_total ?? 0)}`);
    } else {
      setPromoSuccess(null);
    }
  }, [cart]);

  const activeMethods = paymentMethods.filter((method) => method.active);

  useEffect(() => {
    if (!selectedMethod && activeMethods.length > 0) {
      setSelectedMethod(activeMethods[0]._id);
    }
  }, [selectedMethod, activeMethods]);

  if (!guestToken || cart === undefined) {
    return <BrandLoader label="Loading checkout..." />;
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
    <CheckoutShell currentStep="payment" cart={cart}>
      <form
        className="space-y-4 ecom-card p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          if (!selectedMethod) {
            setError("Select a payment method");
            return;
          }
          setSaving(true);
          try {
            await setPaymentMethod({
              cart_id: cart._id,
              guest_token: guestToken,
              payment_method_id: selectedMethod as any,
            });
            navigate("/checkout/review");
          } catch (err: any) {
            setError(err?.message ?? "Unable to save payment method");
          } finally {
            setSaving(false);
          }
        }}
      >
        <h1 className="font-display text-xl">Payment</h1>
        <p className="text-sm text-[#6E6E6E]">
          COD is available nationwide. Local online rails can be enabled later without changing this flow.
        </p>

        <div className="space-y-2">
          {activeMethods.length === 0 ? (
            <p className="text-sm text-red-500">No active payment methods are configured.</p>
          ) : (
            activeMethods.map((method) => (
              <label key={method._id} className="ecom-card p-3 block">
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method._id}
                    checked={selectedMethod === method._id}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                  />
                  <div>
                    <p className="text-sm font-medium">{method.label}</p>
                    {method.instructions && (
                      <p className="text-xs text-[#6E6E6E] mt-0.5">{method.instructions}</p>
                    )}
                  </div>
                </div>
              </label>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-[#111]/10 space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Promo Code</p>
          <div className="flex gap-2">
            <input
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 ecom-input px-3 py-2"
              placeholder="Enter code"
            />
            <button
              type="button"
              className="px-4 border border-[#111]/15 text-sm hover:border-[#D4A05A]"
              disabled={applyingCode}
              onClick={async () => {
                setPromoError(null);
                setPromoSuccess(null);
                const parsed = promoCodeSchema.safeParse({ code: promoCode });
                if (!parsed.success) {
                  setPromoError(parsed.error.issues[0]?.message ?? "Invalid code");
                  return;
                }
                setApplyingCode(true);
                try {
                  const result = await applyCode({
                    cart_id: cart._id,
                    guest_token: guestToken,
                    code: parsed.data.code,
                  });
                  setPromoSuccess(
                    `Applied ${parsed.data.code.toUpperCase()} - saved ${formatPrice(
                      result?.discount_total ?? 0
                    )}`
                  );
                } catch (err: any) {
                  setPromoError(err?.message ?? "Unable to apply code");
                } finally {
                  setApplyingCode(false);
                }
              }}
            >
              {applyingCode ? "Applying..." : "Apply"}
            </button>
            {cart.applied_code ? (
              <button
                type="button"
                className="px-4 border border-red-200 text-red-500 text-sm hover:bg-red-50"
                onClick={async () => {
                  setPromoError(null);
                  setPromoSuccess(null);
                  try {
                    await clearCode({
                      cart_id: cart._id,
                      guest_token: guestToken,
                    });
                    setPromoCode("");
                    setPromoSuccess("Promo code removed");
                  } catch (err: any) {
                    setPromoError(err?.message ?? "Unable to remove code");
                  }
                }}
              >
                Remove
              </button>
            ) : null}
          </div>
          {promoError && <p className="text-xs text-red-500">{promoError}</p>}
          {promoSuccess && <p className="text-xs text-emerald-600">{promoSuccess}</p>}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Continue to Review"}
        </button>
        <p className="text-xs text-[#6E6E6E]">
          Order and shipping updates can be sent through email and WhatsApp once providers are connected.
        </p>
      </form>
    </CheckoutShell>
  );
}
