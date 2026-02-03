import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminDashboard() {
  const products = useQuery(api.products.list) ?? [];
  const categories = useQuery(api.categories.list) ?? [];
  const orders = useQuery(api.orders.listAll) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl mb-2">Overview</h2>
        <p className="text-sm text-[#6E6E6E]">Manage products, content, and orders.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#111]/10">
          <p className="label-text text-[#6E6E6E]">Products</p>
          <p className="font-display text-2xl text-[#111]">{products.length}</p>
        </div>
        <div className="p-4 bg-white border border-[#111]/10">
          <p className="label-text text-[#6E6E6E]">Categories</p>
          <p className="font-display text-2xl text-[#111]">{categories.length}</p>
        </div>
        <div className="p-4 bg-white border border-[#111]/10">
          <p className="label-text text-[#6E6E6E]">Orders</p>
          <p className="font-display text-2xl text-[#111]">{orders.length}</p>
        </div>
      </div>
    </div>
  );
}
