import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Link } from '@remix-run/react';
import { api } from '../../../convex/_generated/api';
import { formatOrderNumber, formatPrice } from '@/lib/format';
import { StatusBadge } from '@/components/OrderTimeline';
import { Search } from 'lucide-react';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminOrders() {
  const orders = useQuery(api.orders.listAll) ?? [];

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (activeTab !== 'all') {
      list = list.filter((o) => o.status === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (o) =>
          o.contact_email?.toLowerCase().includes(q) ||
          o.contact_phone?.toLowerCase().includes(q) ||
          formatOrderNumber(o).toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, activeTab, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  }, [orders]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Orders</h2>
        <span className="text-xs text-[#6E6E6E]">{filteredOrders.length} orders</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors ${
              activeTab === tab
                ? 'bg-[#111] text-white border-[#111]'
                : 'border-[#111]/10 text-[#6E6E6E] hover:text-[#111] hover:border-[#111]/30'
            }`}
          >
            {tab} {statusCounts[tab] ? `(${statusCounts[tab]})` : ''}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by order number, email, or phone..."
          className="w-full border border-[#111]/10 pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4A05A]"
        />
      </div>

      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <Link
            key={order._id}
            to={`/admin/orders/${order._id}`}
            className="block p-4 bg-white border border-[#111]/10 hover:border-[#D4A05A]/40 transition-colors"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">#{formatOrderNumber(order)}</p>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-xs text-[#6E6E6E]">{order.contact_email}</p>
                <p className="text-xs text-[#6E6E6E]">{formatDate(order.created_at)}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                <p className="text-xs text-[#6E6E6E]">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
                {order.payment_method && (
                  <p className="text-xs text-[#6E6E6E]">{order.payment_method.label}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
        {filteredOrders.length === 0 && (
          <p className="text-sm text-[#6E6E6E] py-8 text-center">No orders found.</p>
        )}
      </div>
    </div>
  );
}
