import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useNavigate } from '@remix-run/react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/format';
import { getFreeShippingState } from '@/lib/commerce';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const freeShippingState = getFreeShippingState(totalPrice, 15000);

  return (
    <>
      {/* Overlay */}
      <div
        className={`nav-overlay ${isCartOpen ? 'open' : ''}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-display text-lg font-semibold tracking-wider uppercase">
              Your Bag ({items.length})
            </h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#111] hover:text-[#D4A05A] transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          {items.length > 0 ? (
            <div className="px-6 pt-4">
              <div className="rounded-xl border border-[#111]/10 bg-white px-3 py-2.5">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
                  {freeShippingState.unlocked
                    ? 'Free shipping unlocked for this order'
                    : `Add ${formatPrice(freeShippingState.remaining)} for free shipping`}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#111]/10">
                  <div
                    className="h-full rounded-full bg-[#D4A05A] transition-all duration-500"
                    style={{ width: `${freeShippingState.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1} />
                <p className="font-display text-lg text-[#111] mb-2">Your bag is empty</p>
                <p className="text-sm text-[#6E6E6E]">Add items now and checkout in under a minute.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4">
                    {/* Image */}
                    <div className="w-20 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-[#111] mb-1">{item.name}</h3>
                      <p className="text-xs text-[#6E6E6E] mb-2">Size: {item.size}</p>
                      <p className="text-sm font-medium text-[#111] mb-3">{formatPrice(item.price)}</p>
                      {item.paymentMethods && item.paymentMethods.filter((method) => method.active).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.paymentMethods.filter((method) => method.active).map((method) => (
                            <span key={method.id} className="px-2 py-0.5 text-[10px] border border-[#111]/10 bg-white/70">
                              {method.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                          className="w-7 h-7 border border-gray-200 flex items-center justify-center hover:border-[#D4A05A] transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                          className="w-7 h-7 border border-gray-200 flex items-center justify-center hover:border-[#D4A05A] transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.id, item.size)}
                      className="self-start p-1 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6E6E6E]">Subtotal</span>
                <span className="font-display font-semibold text-[#111]">{formatPrice(totalPrice)}</span>
              </div>
              <p className="text-xs text-[#6E6E6E]">Secure checkout, COD supported, address edits allowed before dispatch.</p>
              <button
                className="w-full btn-primary"
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/checkout');
                }}
              >
                Checkout
              </button>
              <button
                onClick={clearCart}
                className="w-full py-2 text-xs text-[#6E6E6E] hover:text-red-500 transition-colors"
              >
                Clear Bag
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
