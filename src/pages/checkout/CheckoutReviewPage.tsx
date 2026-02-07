import { useMemo, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";
import CheckoutShell from "./CheckoutShell";
import { useCart } from "@/hooks/useCart";

export default function CheckoutReviewPage() {
  const navigate = useNavigate();
  const guestToken = useGuestToken();
  const cart = useQuery(
    api.cart.getCurrent,
    guestToken ? { guest_token: guestToken } : "skip"
  );
  const paymentMethodsQuery = useQuery(api.paymentMethods.list);
  const placeOrder = useMutation(api.checkout.placeOrder);
  const { clearCart } = useCart();
  const { isAuthenticated } = useConvexAuth();

  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const paymentLabel = useMemo(() => {
    if (!cart?.payment_method_id) return "";
    return (
      (paymentMethodsQuery ?? []).find((method) => method._id === cart.payment_method_id)?.label ?? ""
    );
  }, [cart?.payment_method_id, paymentMethodsQuery]);

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

  const contact = cart.checkout_context?.contact_email && cart.checkout_context?.contact_phone
    ? {
        email: cart.checkout_context.contact_email,
        phone: cart.checkout_context.contact_phone,
      }
    : null;
  const address = cart.checkout_context?.shipping_address;

  return (
    <CheckoutShell currentStep="review" cart={cart}>
      <form
        className="space-y-4 ecom-card p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          if (!contact || !address || !cart.payment_method_id) {
            setError("Complete contact, shipping, and payment steps first.");
            return;
          }
          setPlacing(true);
          try {
            const result = await placeOrder({
              cart_id: cart._id,
              guest_token: guestToken,
              payment_method_id: cart.payment_method_id,
              note: note || undefined,
            });
            clearCart();
            const orderPath = `/account/orders/${result.order_id}`;
            if (isAuthenticated) {
              navigate(orderPath);
              return;
            }

            const params = new URLSearchParams();
            params.set("checkout_email", contact.email);
            params.set("redirect", orderPath);
            params.set("guest_token", guestToken);
            params.set("order_id", String(result.order_id));
            params.set("mode", "signUp");
            navigate(`/account/login?${params.toString()}`);
          } catch (err: any) {
            setError(err?.message ?? "Unable to place order");
          } finally {
            setPlacing(false);
          }
        }}
      >
        <h1 className="font-display text-2xl">Review & Place Order</h1>
        <p className="text-sm text-[#6E6E6E]">
          Final check before confirmation. You can still go back and edit contact or shipping details.
        </p>

        <div className="space-y-3 ecom-card p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Contact</p>
          <p className="text-sm">{contact?.email}</p>
          <p className="text-sm">{contact?.phone}</p>
        </div>

        <div className="space-y-3 ecom-card p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Shipping Address</p>
          <p className="text-sm">{address?.line1}</p>
          {address?.line2 ? <p className="text-sm">{address.line2}</p> : null}
          <p className="text-sm">
            {[address?.city, address?.state, address?.postal_code].filter(Boolean).join(" ")}
          </p>
          <p className="text-sm">{address?.country}</p>
        </div>

        <div className="space-y-3 ecom-card p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Payment</p>
          <p className="text-sm">{paymentLabel || "Selected payment method"}</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            Order note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full ecom-input px-3 py-2 min-h-20"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={placing}>
          {placing ? "Placing order..." : "Place Order"}
        </button>
        <p className="text-xs text-[#6E6E6E]">
          By placing this order, you agree to our shipping and returns policies.
        </p>
      </form>
    </CheckoutShell>
  );
}
