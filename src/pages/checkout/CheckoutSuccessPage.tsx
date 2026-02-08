import { Link } from "@remix-run/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import BrandLoader from "@/components/BrandLoader";

export default function CheckoutSuccessPage({ orderNumber }: { orderNumber: string }) {
  const guestToken = useGuestToken();
  const order = useQuery(
    api.orders.getByOrderNumber,
    guestToken
      ? {
          order_number: orderNumber,
          guest_token: guestToken,
        }
      : "skip"
  );

  if (!guestToken || order === undefined) {
    return <BrandLoader label="Loading order..." />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
        <div className="max-w-xl mx-auto bg-white border border-[#111]/10 p-6 space-y-4">
          <h1 className="font-display text-xl">Order Not Found</h1>
          <p className="text-sm text-[#6E6E6E]">
            We could not find this order with the current session.
          </p>
          <div className="flex gap-3">
            <Link to="/track-order" className="btn-primary inline-block">
              Track Order
            </Link>
            <Link to="/" className="inline-block border border-[#111]/10 px-4 py-2 text-sm">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-1xl mx-auto bg-white border border-[#111]/10 p-6 space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Order Confirmed</p>
          <h1 className="font-display text-1xl">Thank you for your order</h1>
          <p className="text-sm text-[#6E6E6E]">
            Order number:{" "}
            <span className="font-medium text-[#111]">
              {formatOrderNumber(order as any)}
            </span>
          </p>
        </div>

        <div className="border border-[#111]/10 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Items</p>
          {order.items.map((item: any) => (
            <div key={item._id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.product_name}</p>
                <p className="text-xs text-[#6E6E6E]">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm">{formatPrice(item.line_total)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-[#111]/10 pt-2 mt-2">
            <span className="text-sm">Total</span>
            <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="border border-[#111]/10 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Shipping</p>
          <p className="text-sm">{order.shipping_address?.line1}</p>
          {order.shipping_address?.line2 ? (
            <p className="text-sm">{order.shipping_address.line2}</p>
          ) : null}
          <p className="text-sm">
            {[order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.postal_code]
              .filter(Boolean)
              .join(" ")}
          </p>
          <p className="text-sm">{order.shipping_address?.country}</p>
        </div>

        <div className="flex gap-3">
          <Link to="/track-order" className="btn-primary inline-block">
            Track Order
          </Link>
          <Link to="/" className="inline-block border border-[#111]/10 px-4 py-2 text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
