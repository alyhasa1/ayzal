import { useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";
import CheckoutShell from "./CheckoutShell";
import { contactSchema } from "@/lib/validation";
import { useCart } from "@/hooks/useCart";
import BrandLoader from "@/components/BrandLoader";

export default function CheckoutInformationPage() {
  const navigate = useNavigate();
  const guestToken = useGuestToken();
  const cart = useQuery(
    api.cart.getCurrent,
    guestToken ? { guest_token: guestToken } : "skip"
  );
  const { items: localItems } = useCart();
  const getOrCreateCart = useMutation(api.cart.getOrCreate);
  const addCartItem = useMutation(api.cart.addItem);
  const startCheckout = useMutation(api.checkout.start);
  const setContact = useMutation(api.checkout.setContact);

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!guestToken) return;
    void getOrCreateCart({ guest_token: guestToken }).then((current) => {
      if (!current) return;
      if ((current.items ?? []).length === 0 && localItems.length > 0) {
        Promise.all(
          localItems.map((item) =>
            addCartItem({
              guest_token: guestToken,
              product_id: item.id as any,
              quantity: item.quantity,
            })
          )
        ).catch(() => {
          // best-effort sync from local bag to server cart
        });
      }
      void startCheckout({
        cart_id: current._id,
        guest_token: guestToken,
        email: current.checkout_context?.contact_email,
        phone: current.checkout_context?.contact_phone,
      });
    });
  }, [guestToken, getOrCreateCart, addCartItem, localItems, startCheckout]);

  useEffect(() => {
    if (!cart) return;
    setContactEmail(cart.checkout_context?.contact_email ?? "");
    setContactPhone(cart.checkout_context?.contact_phone ?? "");
  }, [cart]);

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
    <CheckoutShell currentStep="information" cart={cart}>
      <form
        className="space-y-4 ecom-card p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);

          const parsed = contactSchema.safeParse({
            contact_email: contactEmail,
            contact_phone: contactPhone,
          });
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Enter valid contact details");
            return;
          }

          setSaving(true);
          try {
            await setContact({
              cart_id: cart._id,
              guest_token: guestToken,
              contact_email: parsed.data.contact_email,
              contact_phone: parsed.data.contact_phone,
            });
            navigate("/checkout/shipping");
          } catch (err: any) {
            setError(err?.message ?? "Unable to save contact details");
          } finally {
            setSaving(false);
          }
        }}
      >
        <h1 className="font-display text-xl">Contact Information</h1>
        <p className="text-sm text-[#6E6E6E]">
          We use these details for order confirmation and delivery updates only.
        </p>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full ecom-input px-3 py-2"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Phone</label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full ecom-input px-3 py-2"
            required
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button className="btn-primary w-full" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Continue to Shipping"}
        </button>
        <p className="text-xs text-[#6E6E6E]">
          No account required. You can create one after placing your order.
        </p>
      </form>
    </CheckoutShell>
  );
}
