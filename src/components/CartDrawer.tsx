import { X, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck, Truck } from "lucide-react";
import { useNavigate } from "@remix-run/react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { getFreeShippingState } from "@/lib/commerce";

const browseShortcuts = [
  { label: "New Drops", href: "/search?sort=newest" },
  { label: "Lawn Suits", href: "/search?q=lawn+suits" },
  { label: "Festive Looks", href: "/search?q=festive" },
];

type CartDrawerProps = {
  freeShippingThreshold?: number | null;
};

export default function CartDrawer({ freeShippingThreshold }: CartDrawerProps) {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, clearCart } =
    useCart();
  const navigate = useNavigate();
  const hasFreeShippingPolicy =
    typeof freeShippingThreshold === "number" && freeShippingThreshold > 0;
  const freeShippingState = hasFreeShippingPolicy
    ? getFreeShippingState(totalPrice, freeShippingThreshold)
    : null;
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  const closeDrawer = () => setIsCartOpen(false);

  return (
    <>
      <div className={`nav-overlay ${isCartOpen ? "open" : ""}`} onClick={closeDrawer} />

      <aside className={`cart-drawer ${isCartOpen ? "open" : ""}`}>
        <div className="h-full flex flex-col bg-gradient-to-b from-[#fffdfa] to-[#fffaf4]">
          <div className="px-5 py-4 border-b border-[#111]/10 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#6E6E6E]">Your Shopping Bag</p>
                <h2 className="font-display text-lg tracking-[0.08em] text-[#111] mt-1">
                  {totalUnits} {totalUnits === 1 ? "item" : "items"}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 text-[#111] hover:text-[#D4A05A] transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" strokeWidth={1.6} />
              </button>
            </div>
          </div>

          {items.length > 0 && freeShippingState ? (
            <div className="px-5 pt-4">
              <div className="rounded-xl border border-[#D4A05A]/35 bg-gradient-to-r from-[#fff5e6] to-[#fffaef] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-[#7a5a2c] uppercase tracking-[0.12em]">
                    {freeShippingState.unlocked
                      ? "Free shipping unlocked"
                      : `Add ${formatPrice(freeShippingState.remaining)} for free shipping`}
                  </p>
                  
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#ecd8bb]">
                  <div
                    className="h-full rounded-full bg-[#D4A05A] transition-all duration-500"
                    style={{ width: `${freeShippingState.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-[#fff2dc] border border-[#D4A05A]/40 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-9 h-9 text-[#D4A05A]" strokeWidth={1.2} />
                </div>
                <p className="font-display text-xl text-[#111] tracking-[0.08em]">Your bag is waiting</p>
                <p className="text-sm text-[#6E6E6E] mt-2 max-w-[18rem]">
                  Pick your next favorite outfit. Your selected pieces will show up here instantly.
                </p>
                <button
                  className="btn-primary mt-5 inline-flex items-center gap-2"
                  onClick={() => {
                    closeDrawer();
                    navigate("/search?sort=newest");
                  }}
                >
                  Keep Shopping
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={`${item.id}-${item.size}`}
                    className="rounded-xl border border-[#111]/10 bg-white/90 p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.07)]"
                  >
                    <div className="flex gap-3">
                      <div className="w-[84px] h-[104px] bg-[#f4f0ea] rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#111] line-clamp-2">{item.name}</p>
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#6E6E6E] mt-1">
                          Size: {item.size}
                        </p>
                        <p className="text-sm font-semibold text-[#111] mt-2">{formatPrice(item.price)}</p>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="inline-flex items-center rounded-full border border-[#111]/12 bg-[#fffdf9]">
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:text-[#D4A05A] transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:text-[#D4A05A] transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id, item.size)}
                            className="text-[11px] uppercase tracking-[0.12em] text-[#6E6E6E] hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#111]/10 bg-white/90 px-5 py-4 space-y-3">
            {items.length > 0 ? (
              <>
                <div className="rounded-xl border border-[#111]/10 bg-[#fffdf9] p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#6E6E6E]">Subtotal</span>
                    <span className="font-semibold text-[#111]">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 mt-2">
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.11em] text-[#6E6E6E]">
                      <Truck className="w-3.5 h-3.5 text-[#D4A05A]" />
                      Pakistan-wide delivery
                    </div>
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.11em] text-[#6E6E6E]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#D4A05A]" />
                      Secure checkout and COD
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="btn-secondary px-4 py-3 text-[11px]"
                    onClick={() => {
                      closeDrawer();
                    }}
                  >
                    Continue Shopping
                  </button>
                  <button
                    className="btn-primary px-4 py-3 text-[11px]"
                    onClick={() => {
                      closeDrawer();
                      navigate("/checkout/information");
                    }}
                  >
                    Secure Checkout
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="w-full border border-[#111]/10 py-2 text-[11px] uppercase tracking-[0.12em] hover:border-[#D4A05A] transition-colors"
                    onClick={() => {
                      closeDrawer();
                      navigate("/cart");
                    }}
                  >
                    View Full Bag
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full border border-[#f0d3d3] py-2 text-[11px] uppercase tracking-[0.12em] text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Clear Bag
                  </button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {browseShortcuts.map((shortcut) => (
                  <button
                    key={shortcut.href}
                    className="w-full border border-[#111]/10 py-2 text-[11px] uppercase tracking-[0.12em] hover:border-[#D4A05A] transition-colors"
                    onClick={() => {
                      closeDrawer();
                      navigate(shortcut.href);
                    }}
                  >
                    {shortcut.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
