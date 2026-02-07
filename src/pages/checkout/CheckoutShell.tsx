import { Link } from "@remix-run/react";
import { MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";

const steps = [
  { key: "information", label: "Information", to: "/checkout/information" },
  { key: "shipping", label: "Shipping", to: "/checkout/shipping" },
  { key: "payment", label: "Payment", to: "/checkout/payment" },
  { key: "review", label: "Review", to: "/checkout/review" },
];

export default function CheckoutShell({
  currentStep,
  cart,
  children,
}: {
  currentStep: "information" | "shipping" | "payment" | "review";
  cart: any;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 lg:px-12 py-20">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Checkout</p>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {steps.map((step) => (
                <div key={step.key} className="flex items-center gap-2">
                  {step.key === currentStep ? (
                    <span className="px-2.5 py-1 bg-[#111] text-white uppercase tracking-wider">
                      {step.label}
                    </span>
                  ) : (
                    <Link
                      to={step.to}
                      className="px-2.5 py-1 border border-[#111]/15 text-[#6E6E6E] hover:text-[#111]"
                    >
                      {step.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          {children}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-lg">Order Summary</h2>
          <div className="trust-chip bg-[#f3f7ff] border border-[#bfd2ff] text-[#2b4f9b]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Protected guest checkout
          </div>
          <div className="bg-white border border-[#111]/10 p-4 space-y-3 lg:sticky lg:top-24">
            {(cart?.items ?? []).length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">Your cart is empty.</p>
            ) : (
              (cart?.items ?? []).map((item: any) => (
                <div key={item._id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product?.name ?? item.product_name ?? "Product"}
                    </p>
                    <p className="text-xs text-[#6E6E6E]">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm">{formatPrice(item.line_total ?? 0)}</p>
                </div>
              ))
            )}

            <div className="border-t border-[#111]/10 pt-3 space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#6E6E6E]">Subtotal</span>
                <span>{formatPrice(cart?.subtotal ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E6E6E]">Discount</span>
                <span>- {formatPrice(cart?.discount_total ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E6E6E]">Shipping</span>
                <span>{formatPrice(cart?.shipping_total ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E6E6E]">Tax</span>
                <span>{formatPrice(cart?.tax_total ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#111]/10 pt-2 mt-2">
                <span className="font-medium">Total</span>
                <span className="font-semibold">{formatPrice(cart?.total ?? 0)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-[#111]/10 pt-3">
              <div className="inline-flex items-center gap-2 text-xs text-[#6E6E6E]">
                <Truck className="w-3.5 h-3.5 text-[#D4A05A]" />
                Fast dispatch across Pakistan
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-[#6E6E6E]">
                <MessageCircle className="w-3.5 h-3.5 text-[#D4A05A]" />
                WhatsApp support updates are ready
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
