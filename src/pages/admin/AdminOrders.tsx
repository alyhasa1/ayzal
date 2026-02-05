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
  const adminUpdate = useMutation(api.orders.adminUpdate);
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        status: string;
        tracking_carrier: string;
        tracking_number: string;
        tracking_url: string;
        note: string;
      }
    >
  >({});

  const getDraft = (order: any) => {
    const key = String(order._id);
    const existing = drafts[key];
    if (existing) return existing;
    return {
      status: order.status ?? 'pending',
      tracking_carrier: order.tracking_carrier ?? '',
      tracking_number: order.tracking_number ?? '',
      tracking_url: order.tracking_url ?? '',
      note: '',
    };
  };

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

          <div className="space-y-3 border-t border-[#111]/10 pt-4">
            <p className="label-text text-[#6E6E6E]">Update Status & Tracking</p>
            <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr] gap-3 items-start">
              <select
                className="border border-[#111]/10 px-3 py-2 text-sm bg-white"
                value={getDraft(order).status}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [String(order._id)]: { ...getDraft(order), status: e.target.value },
                  }))
                }
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  value={getDraft(order).tracking_carrier}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [String(order._id)]: { ...getDraft(order), tracking_carrier: e.target.value },
                    }))
                  }
                  placeholder="Carrier (e.g. TCS)"
                  className="border border-[#111]/10 px-3 py-2 text-sm"
                />
                <input
                  value={getDraft(order).tracking_number}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [String(order._id)]: { ...getDraft(order), tracking_number: e.target.value },
                    }))
                  }
                  placeholder="Tracking number"
                  className="border border-[#111]/10 px-3 py-2 text-sm"
                />
                <input
                  value={getDraft(order).tracking_url}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [String(order._id)]: { ...getDraft(order), tracking_url: e.target.value },
                    }))
                  }
                  placeholder="Tracking URL (optional)"
                  className="border border-[#111]/10 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={getDraft(order).note}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [String(order._id)]: { ...getDraft(order), note: e.target.value },
                  }))
                }
                placeholder="Internal / customer-visible note (shows in timeline)"
                className="flex-1 border border-[#111]/10 px-3 py-2 text-sm"
              />
              <button
                className="btn-primary"
                onClick={async () => {
                  const draft = getDraft(order);
                  const updates: any = { id: order._id };

                  const currentCarrier = order.tracking_carrier ?? '';
                  const currentNumber = order.tracking_number ?? '';
                  const currentUrl = order.tracking_url ?? '';

                  if (draft.status !== order.status) updates.status = draft.status;
                  if (draft.tracking_carrier !== currentCarrier) updates.tracking_carrier = draft.tracking_carrier;
                  if (draft.tracking_number !== currentNumber) updates.tracking_number = draft.tracking_number;
                  if (draft.tracking_url !== currentUrl) updates.tracking_url = draft.tracking_url;
                  if (draft.note.trim()) updates.note = draft.note.trim();

                  if (Object.keys(updates).length === 1) return;
                  await adminUpdate(updates);

                  setDrafts((prev) => ({
                    ...prev,
                    [String(order._id)]: { ...draft, note: '' },
                  }));
                }}
              >
                Save
              </button>
            </div>
          </div>

          <details className="border-t border-[#111]/10 pt-4">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]">
              View timeline
            </summary>
            <div className="mt-3 space-y-2">
              {order.status_events.map((event: any) => (
                <div
                  key={event._id}
                  className="border border-[#111]/10 px-3 py-2 text-sm flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="uppercase tracking-widest text-xs">{event.status}</span>
                    <span className="text-xs text-[#6E6E6E]">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  {event.note && <div className="text-xs text-[#6E6E6E]">{event.note}</div>}
                </div>
              ))}
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
