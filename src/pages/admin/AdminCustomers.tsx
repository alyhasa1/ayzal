import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Link } from '@remix-run/react';
import { api } from '../../../convex/_generated/api';
import { formatPrice } from '@/lib/format';
import { Search, Users } from 'lucide-react';

function formatDate(ts: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminCustomers() {
  const customers = useQuery(api.userProfiles.adminListAll) ?? [];
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">Customers</h2>
        <span className="text-xs text-[#6E6E6E]">{customers.length} total</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E6E6E]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email, name, or phone..."
          className="w-full border border-[#111]/10 pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:border-[#D4A05A]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-[#6E6E6E]">
          <Users className="w-8 h-8 mb-2 opacity-40" />
          <p className="text-sm">No customers found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#111]/10 text-left">
                <th className="pb-2 text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Customer</th>
                <th className="pb-2 text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Phone</th>
                <th className="pb-2 text-xs uppercase tracking-widest text-[#6E6E6E] font-medium text-right">Orders</th>
                <th className="pb-2 text-xs uppercase tracking-widest text-[#6E6E6E] font-medium text-right">Total Spent</th>
                <th className="pb-2 text-xs uppercase tracking-widest text-[#6E6E6E] font-medium text-right">Last Order</th>
                <th className="pb-2 text-xs uppercase tracking-widest text-[#6E6E6E] font-medium text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer._id} className="border-b border-[#111]/5 hover:bg-[#111]/[0.02] cursor-pointer">
                  <td className="py-3 pr-4">
                    <Link to={`/admin/customers/${customer._id}`} className="block">
                      <p className="font-medium hover:text-[#D4A05A] transition-colors">{customer.name || '—'}</p>
                      <p className="text-xs text-[#6E6E6E]">{customer.email}</p>
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-[#6E6E6E]">{customer.phone || '—'}</td>
                  <td className="py-3 pr-4 text-right">
                    {customer.orderCount > 0 ? (
                      <span className="inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 bg-[#111]/5 border border-[#111]/10">
                        {customer.orderCount}
                      </span>
                    ) : (
                      <span className="text-[#6E6E6E]">0</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right font-medium">
                    {customer.totalSpent > 0 ? formatPrice(customer.totalSpent) : '—'}
                  </td>
                  <td className="py-3 pr-4 text-right text-[#6E6E6E]">
                    {formatDate(customer.lastOrderAt)}
                  </td>
                  <td className="py-3 text-right text-[#6E6E6E]">
                    {formatDate(customer.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
