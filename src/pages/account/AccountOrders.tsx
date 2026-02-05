import { Link } from '@remix-run/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatOrderNumber, formatPrice } from '@/lib/format';
import { StatusBadge } from '@/components/OrderTimeline';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AccountOrders() {
  const orders = useQuery(api.orders.listForUser) ?? [];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl">Your Orders</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-[#6E6E6E]">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/account/orders/${order._id}`}
              className="block p-4 bg-white border border-[#111]/10 hover:border-[#D4A05A]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">#{formatOrderNumber(order)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-[#6E6E6E]">{formatDate(order.created_at)}</p>
                  <p className="text-xs text-[#6E6E6E]">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatPrice(order.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
