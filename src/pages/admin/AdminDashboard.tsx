import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { Link } from '@remix-run/react';
import { api } from '../../../convex/_generated/api';
import { formatPrice, formatOrderNumber } from '@/lib/format';
import { StatusBadge } from '@/components/OrderTimeline';
import { Package, ShoppingCart, Users, AlertTriangle } from 'lucide-react';

function StatCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href?: string;
}) {
  const content = (
    <div className="p-4 bg-white border border-[#111]/10 flex items-center gap-3 hover:border-[#D4A05A]/40 transition-colors">
      <div className="p-2 bg-[#111]/5">
        <Icon className="w-5 h-5 text-[#6E6E6E]" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">{label}</p>
        <p className="font-display text-xl text-[#111]">{value}</p>
      </div>
    </div>
  );
  if (href) return <Link to={href}>{content}</Link>;
  return content;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
  });
}

export default function AdminDashboard() {
  const productsQuery = useQuery(api.products.list);
  const products = productsQuery ?? [];
  const categories = useQuery(api.categories.list) ?? [];
  const ordersQuery = useQuery(api.orders.listAll);
  const orders = ordersQuery ?? [];

  const stats = useMemo(() => {
    const productRows = productsQuery ?? [];
    const orderRows = ordersQuery ?? [];
    const now = Date.now();
    const dayMs = 86400000;
    const today = now - dayMs;
    const week = now - 7 * dayMs;
    const month = now - 30 * dayMs;

    let revenueToday = 0;
    let revenueWeek = 0;
    let revenueMonth = 0;
    let revenueAll = 0;
    const statusCounts: Record<string, number> = {};

    for (const o of orderRows) {
      revenueAll += o.total ?? 0;
      if (o.created_at >= today) revenueToday += o.total ?? 0;
      if (o.created_at >= week) revenueWeek += o.total ?? 0;
      if (o.created_at >= month) revenueMonth += o.total ?? 0;
      statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
    }

    const outOfStock = productRows.filter((p: any) => p.in_stock === false);
    const recentOrders = [...orderRows]
      .sort((a: any, b: any) => b.created_at - a.created_at)
      .slice(0, 5);

    return {
      revenueToday,
      revenueWeek,
      revenueMonth,
      revenueAll,
      statusCounts,
      outOfStock,
      recentOrders,
    };
  }, [ordersQuery, productsQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl mb-1">Overview</h2>
        <p className="text-sm text-[#6E6E6E]">Manage products, content, and orders.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Products" value={products.length} icon={Package} href="/admin/products" />
        <StatCard label="Categories" value={categories.length} icon={Package} href="/admin/categories" />
        <StatCard label="Orders" value={orders.length} icon={ShoppingCart} href="/admin/orders" />
        <StatCard label="Customers" value="—" icon={Users} href="/admin/customers" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-[#111]/10">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Today</p>
          <p className="font-display text-lg text-[#111]">{formatPrice(stats.revenueToday)}</p>
        </div>
        <div className="p-4 bg-white border border-[#111]/10">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">This Week</p>
          <p className="font-display text-lg text-[#111]">{formatPrice(stats.revenueWeek)}</p>
        </div>
        <div className="p-4 bg-white border border-[#111]/10">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">This Month</p>
          <p className="font-display text-lg text-[#111]">{formatPrice(stats.revenueMonth)}</p>
        </div>
        <div className="p-4 bg-white border border-[#111]/10">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">All Time</p>
          <p className="font-display text-lg text-[#111]">{formatPrice(stats.revenueAll)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <div className="bg-white border border-[#111]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Orders by Status</p>
          </div>
          <div className="space-y-2">
            {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
              const count = stats.statusCounts[status] ?? 0;
              const pct = orders.length > 0 ? (count / orders.length) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <StatusBadge status={status} />
                  <div className="flex-1 h-2 bg-[#111]/5 overflow-hidden">
                    <div
                      className="h-full bg-[#D4A05A] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#6E6E6E] w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#111]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Recent Orders</p>
            <Link to="/admin/orders" className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]">
              View all
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((order: any) => (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="flex items-center justify-between py-1.5 hover:bg-[#111]/[0.02] -mx-1 px-1 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{formatOrderNumber(order)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#6E6E6E]">{formatDate(order.created_at)}</span>
                    <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.outOfStock.length > 0 && (
        <div className="bg-white border border-red-200 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-xs uppercase tracking-widest text-red-600 font-medium">
              Out of Stock ({stats.outOfStock.length})
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.outOfStock.map((p: any) => (
              <span key={p._id} className="text-xs px-2 py-1 bg-red-50 border border-red-100 text-red-700">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
