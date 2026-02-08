import { useEffect, useMemo, useState } from "react";
import { Link, useMatches, useNavigate } from "@remix-run/react";
import { Minus, Plus, ShieldCheck, Sparkles, Trash2, Truck } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";
import BrandLoader from "@/components/BrandLoader";
import { formatPrice } from "@/lib/format";
import { getFreeShippingState, pickCrossSellCandidates, toIdSet } from "@/lib/commerce";

export default function CartPage() {
  const navigate = useNavigate();
  const matches = useMatches();
  const guestToken = useGuestToken();
  const getOrCreateCart = useMutation(api.cart.getOrCreate);
  const updateItem = useMutation(api.cart.updateItem);
  const removeItem = useMutation(api.cart.removeItem);
  const cart = useQuery(
    api.cart.getCurrent,
    guestToken ? { guest_token: guestToken } : "skip"
  );
  const suggestionsResult = useQuery(api.products.search, {
    sort: "best-selling",
    limit: 8,
  });
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const rootData = matches.find((match) => match.id === "root")?.data as
    | {
        freeShippingPolicy?: {
          threshold?: number;
        } | null;
      }
    | undefined;
  const freeShippingThreshold = rootData?.freeShippingPolicy?.threshold;
  const freeShipping =
    typeof freeShippingThreshold === "number" && freeShippingThreshold > 0
      ? getFreeShippingState(cart?.subtotal ?? 0, freeShippingThreshold)
      : null;

  const suggestions = useMemo(() => {
    const products = suggestionsResult?.products ?? [];
    if (products.length === 0) return [];
    const cartIds = toIdSet(
      (cart?.items ?? []).map((item: any) => String(item.product_id ?? item.product?._id ?? ""))
    );
    return pickCrossSellCandidates(products, {
      excludeIds: cartIds,
      limit: 4,
    });
  }, [suggestionsResult, cart?.items]);

  useEffect(() => {
    if (!guestToken) return;
    void getOrCreateCart({ guest_token: guestToken });
  }, [guestToken, getOrCreateCart]);

  if (!guestToken || cart === undefined) {
    return <BrandLoader label="Loading your bag..." />;
  }

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Your Bag</p>
          <h1 className="font-display text-1xl mt-1">Cart</h1>
        </div>

        {!cart || (cart.items ?? []).length === 0 ? (
          <div className="bg-white border border-[#111]/10 p-6 text-center space-y-3">
            <p className="text-sm text-[#6E6E6E]">Your cart is empty.</p>
            <Link to="/" className="btn-primary inline-block">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {freeShipping ? (
              <div className="rounded-xl border border-[#D4A05A]/30 bg-[#fff7ec] px-4 py-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="text-[#7a5a2c]">
                    {!freeShipping.unlocked
                      ? `Add ${formatPrice(freeShipping.remaining)} more for free shipping`
                      : "You unlocked free shipping"}
                  </p>
                  <p className="text-[#7a5a2c] font-medium">{freeShipping.progress}%</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#e9d9bf] overflow-hidden">
                  <div
                    className="h-full bg-[#D4A05A] transition-all duration-500"
                    style={{ width: `${freeShipping.progress}%` }}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.4fr] gap-6">
              <div className="bg-white border border-[#111]/10 divide-y divide-[#111]/10">
                {cart.items.map((item: any) => (
                  <div key={item._id} className="p-4 flex gap-4 items-start">
                    <div className="w-20 h-24 bg-gray-100 overflow-hidden flex-shrink-0">
                      {item.product?.primary_image_url ? (
                        <img
                          src={item.product.primary_image_url}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.product?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-[#6E6E6E]">{formatPrice(item.unit_price ?? 0)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="w-7 h-7 border border-[#111]/10 flex items-center justify-center"
                          disabled={busyItemId === item._id}
                          onClick={async () => {
                            setBusyItemId(item._id);
                            try {
                              await updateItem({
                                guest_token: guestToken,
                                item_id: item._id,
                                quantity: Math.max(1, item.quantity - 1),
                              });
                            } finally {
                              setBusyItemId(null);
                            }
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          className="w-7 h-7 border border-[#111]/10 flex items-center justify-center"
                          disabled={busyItemId === item._id}
                          onClick={async () => {
                            setBusyItemId(item._id);
                            try {
                              await updateItem({
                                guest_token: guestToken,
                                item_id: item._id,
                                quantity: item.quantity + 1,
                              });
                            } finally {
                              setBusyItemId(null);
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-sm font-medium">{formatPrice(item.line_total ?? 0)}</p>
                      <button
                        type="button"
                        className="text-xs text-red-500 inline-flex items-center gap-1"
                        disabled={busyItemId === item._id}
                        onClick={async () => {
                          setBusyItemId(item._id);
                          try {
                            await removeItem({
                              guest_token: guestToken,
                              item_id: item._id,
                            });
                          } finally {
                            setBusyItemId(null);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-[#111]/10 p-5 space-y-3 h-fit lg:sticky lg:top-24">
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f3f7ff] border border-[#bfd2ff] px-3 py-1.5 text-[11px] uppercase tracking-widest text-[#2b4f9b]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Guest checkout in under 60 seconds
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6E6E6E]">Subtotal</span>
                  <span>{formatPrice(cart.subtotal ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6E6E6E]">Discount</span>
                  <span>- {formatPrice(cart.discount_total ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6E6E6E]">Shipping</span>
                  <span>{formatPrice(cart.shipping_total ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold border-t border-[#111]/10 pt-3">
                  <span>Total</span>
                  <span>{formatPrice(cart.total ?? 0)}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 py-1">
                  <div className="inline-flex items-center gap-2 text-xs text-[#6E6E6E]">
                    <Truck className="w-3.5 h-3.5 text-[#D4A05A]" />
                    Pakistan-wide delivery tracking
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-[#6E6E6E]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4A05A]" />
                    COD and secure customer support
                  </div>
                </div>
                <button
                  className="btn-primary w-full"
                  onClick={() => navigate("/checkout/information")}
                >
                  Checkout
                </button>
              </div>
            </div>

            {suggestions.length > 0 ? (
              <section className="border-t border-[#111]/10 pt-6">
                <h2 className="font-display text-xl text-[#111] mb-4">Complete Your Look</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {suggestions.map((product: any) => (
                    <Link
                      key={product._id}
                      to={`/product/${product.slug ?? product._id}`}
                      className="bg-white border border-[#111]/10 p-3 group"
                    >
                      <div className="aspect-[4/5] bg-gray-100 overflow-hidden mb-3">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <p className="text-sm text-[#111] line-clamp-2">{product.name}</p>
                      <p className="text-sm text-[#6E6E6E] mt-1">{formatPrice(product.price)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
