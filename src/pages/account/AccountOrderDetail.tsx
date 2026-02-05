import { useParams, Link } from '@remix-run/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatOrderNumber, formatPrice } from '@/lib/format';
import OrderTimeline, { StatusBadge } from '@/components/OrderTimeline';
import { ArrowLeft, ExternalLink } from 'lucide-react';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AccountOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const order = useQuery(api.orders.getById, id ? { id: id as Id<'orders'> } : 'skip');

  if (order === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#6E6E6E]">Order not found.</p>
        <Link to="/account/orders" className="btn-primary inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#6E6E6E]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/account/orders"
          className="p-2 border border-[#111]/10 hover:border-[#D4A05A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl">#{formatOrderNumber(order)}</h2>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-[#6E6E6E]">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {(order.tracking_number || order.tracking_url || order.tracking_carrier) && (
        <div className="border-2 border-[#D4A05A]/30 bg-[#D4A05A]/5 p-4 space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Shipment Tracking</p>
          <div className="flex flex-wrap items-center gap-3">
            {order.tracking_carrier && (
              <span className="text-sm font-medium">{order.tracking_carrier}</span>
            )}
            {order.tracking_number && (
              <span className="text-sm">
                #{order.tracking_number}
              </span>
            )}
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#D4A05A] hover:text-[#111] font-medium"
              >
                Track shipment <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#111]/10 p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Items</p>
          <div className="space-y-3">
            {order.items.map((item: any) => (
              <div key={item._id} className="flex items-center gap-3">
                {item.product_image_url && (
                  <div className="w-10 h-10 flex-shrink-0 bg-gray-100 overflow-hidden border border-[#111]/5">
                    <img src={item.product_image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name}</p>
                  <p className="text-xs text-[#6E6E6E]">
                    {formatPrice(item.unit_price)} x {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium flex-shrink-0">{formatPrice(item.line_total)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#111]/10 pt-3 flex items-center justify-between">
            <span className="text-sm text-[#6E6E6E]">Total</span>
            <span className="text-sm font-semibold">{formatPrice(order.total)}</span>
          </div>
          {order.payment_method && (
            <p className="text-xs text-[#6E6E6E]">Payment: {order.payment_method.label}</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#111]/10 p-5 space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Shipping Address</p>
            <div className="text-sm space-y-0.5">
              <p>{order.contact_phone}</p>
              <p>{order.shipping_address?.line1}</p>
              {order.shipping_address?.line2 && <p>{order.shipping_address.line2}</p>}
              <p>
                {[order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.postal_code]
                  .filter(Boolean)
                  .join(' ')}
              </p>
              {order.shipping_address?.country && <p>{order.shipping_address.country}</p>}
            </div>
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Timeline</p>
            <OrderTimeline events={order.status_events} />
          </div>
        </div>
      </div>
    </div>
  );
}
