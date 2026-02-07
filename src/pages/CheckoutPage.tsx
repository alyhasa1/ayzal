import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/format';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const paymentMethodsQuery = useQuery(api.paymentMethods.list);
  const user = useQuery(api.users.me);
  const profile = useQuery(api.userProfiles.get);
  const upsertProfile = useMutation(api.userProfiles.upsert);
  const createOrder = useMutation(api.orders.create);

  const activeMethods = useMemo(
    () => (paymentMethodsQuery ?? []).filter((method) => method.active),
    [paymentMethodsQuery]
  );

  const allowedMethods = useMemo(() => {
    if (items.length === 0) return [];
    let intersection = activeMethods.map((method) => method._id);
    items.forEach((item) => {
      const itemMethods = item.paymentMethods?.length
        ? item.paymentMethods.map((method) => method.id)
        : intersection;
      intersection = intersection.filter((id) => itemMethods.includes(id));
    });
    return activeMethods.filter((method) => intersection.includes(method._id));
  }, [items, activeMethods]);

  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setContactPhone(profile.phone ?? '');
      setLine1(profile.shipping_address?.line1 ?? '');
      setLine2(profile.shipping_address?.line2 ?? '');
      setCity(profile.shipping_address?.city ?? '');
      setState(profile.shipping_address?.state ?? '');
      setPostalCode(profile.shipping_address?.postal_code ?? '');
      setCountry(profile.shipping_address?.country ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (allowedMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(allowedMethods[0]._id);
    }
  }, [allowedMethods, selectedMethod]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F6F2EE] flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-[#6E6E6E]">Your cart is empty.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!selectedMethod) {
      setError('Select a payment method.');
      return;
    }
    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    setLoading(true);
    try {
      await upsertProfile({
        phone: contactPhone,
        shipping_address: {
          line1,
          line2,
          city,
          state,
          postal_code: postalCode,
          country,
        },
      });
      const orderId = await createOrder({
        items: items.map((item) => ({ product_id: item.id as any, quantity: item.quantity })),
        payment_method_id: selectedMethod as any,
        shipping_address: {
          line1,
          line2,
          city,
          state,
          postal_code: postalCode,
          country,
        },
        contact_email: contactEmail,
        contact_phone: contactPhone,
      });
      clearCart();
      navigate(`/account/orders/${orderId}`);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 lg:px-12 py-24">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
        <div className="space-y-6">
          <h1 className="font-display text-2xl">Checkout</h1>
          <form onSubmit={handleSubmit} className="space-y-5 text-sm">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Contact Information</p>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-[#111]/10 pt-5">
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Shipping Address</p>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                  Address Line 1 <span className="text-red-500">*</span>
                </label>
                <input
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                  Address Line 2
                </label>
                <input
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                    State / Province
                  </label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                    Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#6E6E6E] mb-1.5">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full border border-[#111]/10 px-3 py-2 focus:outline-none focus:border-[#D4A05A] transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-[#111]/10 pt-5">
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Payment Method</p>
              {allowedMethods.length === 0 ? (
                <p className="text-xs text-red-500">No valid payment methods available.</p>
              ) : (
                allowedMethods.map((method) => (
                  <label key={method._id} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method._id}
                      checked={selectedMethod === method._id}
                      onChange={(e) => setSelectedMethod(e.target.value)}
                    />
                    {method.label}
                  </label>
                ))
              )}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Placing order...' : 'Place Order'}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-lg">Order Summary</h2>
          <div className="bg-white border border-[#111]/10 p-4 space-y-4">
            {items.map((item) => (
              <div key={`${item.id}-${item.quantity}`} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-[#6E6E6E]">Qty: {item.quantity}</p>
                </div>
                <p>{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm border-t border-[#111]/10 pt-3">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
