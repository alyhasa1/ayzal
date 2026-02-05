import { useParams, useNavigate } from '@remix-run/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatPrice } from '@/lib/format';

export default function AccountOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const order = useQuery(api.orders.getById, id ? { id: id as Id<'orders'> } : 'skip');
  const navigate = useNavigate();

  if (order === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#6E6E6E]">Order not found.</p>
        <button className="btn-primary" onClick={() => navigate('/account/orders')}>
          Back to orders
        </button>
      </div>
    );
  }

  if (!order) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl">Order {order._id}</h2>
          <p className="text-sm text-[#6E6E6E]">Status: {order.status}</p>
        </div>
        <button className="text-xs uppercase tracking-widest" onClick={() => navigate('/account/orders')}>
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <p className="label-text text-[#6E6E6E]">Items</p>
          {order.items.map((item: any) => (
            <div key={item._id} className="flex items-center justify-between text-sm">
              <span>{item.product_name} x {item.quantity}</span>
              <span>{formatPrice(item.line_total)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="label-text text-[#6E6E6E]">Shipping</p>
          <p className="text-sm">{order.contact_phone}</p>
          <p className="text-sm">{order.shipping_address?.line1}</p>
          <p className="text-sm">{order.shipping_address?.city} {order.shipping_address?.postal_code}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="label-text text-[#6E6E6E]">Status Timeline</p>
        <div className="space-y-2">
          {order.status_events.map((event: any) => (
            <div key={event._id} className="flex items-center justify-between text-sm border border-[#111]/10 px-3 py-2">
              <span className="uppercase tracking-widest text-xs">{event.status}</span>
              <span className="text-xs text-[#6E6E6E]">
                {new Date(event.created_at).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
