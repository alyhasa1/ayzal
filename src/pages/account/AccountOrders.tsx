import { useNavigate } from '@remix-run/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatOrderNumber, formatPrice } from '@/lib/format';

export default function AccountOrders() {
  const orders = useQuery(api.orders.listForUser) ?? [];
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl">Your Orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-[#6E6E6E]">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="p-4 bg-white border border-[#111]/10 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Order #{formatOrderNumber(order)}</p>
                <p className="text-xs text-[#6E6E6E]">{order.status}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                <button
                  className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
                  onClick={() => navigate(`/account/orders/${order._id}`)}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
