import { useParams, Link } from '@remix-run/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatOrderNumber, formatPrice } from '@/lib/format';
import { StatusBadge } from '@/components/OrderTimeline';
import { ArrowLeft, Mail, Phone, MapPin, ShoppingCart, Calendar } from 'lucide-react';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-[#6E6E6E] mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = useQuery(
    api.userProfiles.adminGetById,
    id ? { id: id as Id<'users'> } : 'skip'
  );

  if (customer === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#6E6E6E]">Customer not found.</p>
        <Link to="/admin/customers" className="btn-primary inline-block">
          Back to customers
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#6E6E6E]">Loading...</p>
      </div>
    );
  }

  const address = customer.shippingAddress;
  const addressStr = address
    ? [address.line1, address.line2, address.city, address.state, address.postal_code, address.country]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/customers"
          className="p-2 border border-[#111]/10 hover:border-[#D4A05A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="font-display text-xl">{customer.name || customer.email}</h2>
          {customer.name && (
            <p className="text-xs text-[#6E6E6E]">{customer.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-[#111]/10 p-5 space-y-1">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium mb-3">
              Customer Information
            </p>
            <InfoRow icon={Mail} label="Email" value={customer.email} />
            <InfoRow icon={Phone} label="Phone" value={customer.phone} />
            <InfoRow icon={MapPin} label="Saved Address" value={addressStr} />
            <InfoRow icon={Calendar} label="Joined" value={formatDate(customer.createdAt)} />
          </div>

          <div className="bg-white border border-[#111]/10 p-5">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium mb-3">
              Summary
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#6E6E6E]">Total Orders</p>
                <p className="font-display text-lg">{customer.orderCount}</p>
              </div>
              <div>
                <p className="text-xs text-[#6E6E6E]">Total Spent</p>
                <p className="font-display text-lg">{formatPrice(customer.totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#111]/10 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Orders ({customer.orderCount})
            </p>
          </div>
          {customer.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#6E6E6E]">
              <ShoppingCart className="w-6 h-6 mb-2 opacity-40" />
              <p className="text-sm">No orders yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.orders.map((order: any) => (
                <Link
                  key={order._id}
                  to={`/admin/orders/${order._id}`}
                  className="block border border-[#111]/5 p-3 hover:border-[#D4A05A]/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{formatOrderNumber(order)}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-[#6E6E6E]">{formatDateTime(order.created_at)}</p>
                      <p className="text-xs text-[#6E6E6E]">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        {order.payment_method ? ` · ${order.payment_method.label}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                  </div>

                  {order.shipping_address && (
                    <div className="mt-2 pt-2 border-t border-[#111]/5">
                      <p className="text-xs text-[#6E6E6E]">
                        <span className="font-medium">Ship to:</span>{' '}
                        {[
                          order.shipping_address.line1,
                          order.shipping_address.city,
                          order.shipping_address.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {order.contact_phone && (
                        <p className="text-xs text-[#6E6E6E]">
                          <span className="font-medium">Phone:</span> {order.contact_phone}
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
