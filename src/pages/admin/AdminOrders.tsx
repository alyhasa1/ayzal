import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatPrice } from '@/lib/format';

const statusOptions = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrders() {
  const orders = useQuery(api.orders.listAll) ?? [];
  const updateStatus = useMutation(api.orders.updateStatus);
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl">Orders</h2>
      {orders.map((order) => (
        <div key={order._id} className="p-4 bg-white border border-[#111]/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Order {order._id}</p>
              <p className="text-xs text-[#6E6E6E]">{order.contact_email}</p>
            </div>
            <div className="text-right">
              <p className="text-sm">{formatPrice(order.total)}</p>
              <p className="text-xs text-[#6E6E6E]">{order.status}</p>
              {order.payment_method && (
                <p className="text-xs text-[#6E6E6E]">{order.payment_method.label}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="label-text text-[#6E6E6E] mb-2">Items</p>
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item._id} className="flex items-center justify-between text-sm">
                    <span>{item.product_name} ? {item.quantity}</span>
                    <span>{formatPrice(item.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="label-text text-[#6E6E6E] mb-2">Shipping</p>
              <p className="text-sm">{order.contact_phone}</p>
              <p className="text-sm">{order.shipping_address?.line1}</p>
              <p className="text-sm">{order.shipping_address?.city} {order.shipping_address?.postal_code}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              className="border border-[#111]/10 px-3 py-2 text-sm"
              value={order.status}
              onChange={(e) => updateStatus({ id: order._id, status: e.target.value })}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              value={notes[order._id] ?? ''}
              onChange={(e) => setNotes((prev) => ({ ...prev, [order._id]: e.target.value }))}
              placeholder="Add status note"
              className="flex-1 border border-[#111]/10 px-3 py-2 text-sm"
            />
            <button
              className="btn-primary"
              onClick={() => {
                const note = notes[order._id];
                updateStatus({ id: order._id, status: order.status, note });
                setNotes((prev) => ({ ...prev, [order._id]: '' }));
              }}
            >
              Add Note
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
