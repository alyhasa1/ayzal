import { useParams, Link } from "@remix-run/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/OrderTimeline";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Calendar,
  LifeBuoy,
  Clock3,
} from "lucide-react";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
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
  const customer = useQuery(api.userProfiles.adminGetById, id ? { id: id as Id<"users"> } : "skip");
  const customer360 = useQuery(api.customers360.get, id ? { user_id: id as Id<"users"> } : "skip");

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
        .join(", ")
    : "";

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
          {customer.name ? <p className="text-xs text-[#6E6E6E]">{customer.email}</p> : null}
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#6E6E6E]">Total Orders</p>
                <p className="font-display text-lg">{customer.orderCount}</p>
              </div>
              <div>
                <p className="text-xs text-[#6E6E6E]">Total Spent</p>
                <p className="font-display text-lg">{formatPrice(customer.totalSpent)}</p>
              </div>
              <div>
                <p className="text-xs text-[#6E6E6E]">Support Tickets</p>
                <p className="font-display text-lg">{customer360?.tickets?.length ?? 0}</p>
              </div>
              <div>
                <p className="text-xs text-[#6E6E6E]">Segments</p>
                <p className="font-display text-lg">{customer360?.segments?.length ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Segments
            </p>
            {customer360 === undefined ? (
              <p className="text-sm text-[#6E6E6E]">Loading segments...</p>
            ) : (customer360?.segments ?? []).length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No segment memberships yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(customer360?.segments ?? []).map((segment: any) => (
                  <span
                    key={segment._id}
                    className={`text-xs px-2 py-1 border ${
                      segment.segment_active
                        ? "border-[#111]/10 bg-[#111]/5"
                        : "border-red-200 text-red-600 bg-red-50"
                    }`}
                  >
                    {segment.segment_name || segment.segment_key || "Segment"}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-[#6E6E6E]" />
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
                Customer Timeline
              </p>
            </div>
            {customer360 === undefined ? (
              <p className="text-sm text-[#6E6E6E]">Loading timeline...</p>
            ) : (customer360?.timeline ?? []).length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No timeline events captured yet.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {(customer360?.timeline ?? []).slice(0, 15).map((event: any) => (
                  <div key={event._id} className="border border-[#111]/10 p-2">
                    <p className="text-xs uppercase tracking-widest">{event.event_type}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                    {event.source ? <p className="text-xs text-[#6E6E6E]">Source: {event.source}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Notification Preferences
            </p>
            {customer360 === undefined ? (
              <p className="text-sm text-[#6E6E6E]">Loading notification preferences...</p>
            ) : !customer360?.notification_preferences ? (
              <p className="text-sm text-[#6E6E6E]">No saved notification preferences.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#6E6E6E]">
                <p>
                  Email marketing:{" "}
                  {customer360.notification_preferences.email_marketing ? "On" : "Off"}
                </p>
                <p>
                  Email order updates:{" "}
                  {customer360.notification_preferences.email_order_updates ? "On" : "Off"}
                </p>
                <p>
                  WhatsApp marketing:{" "}
                  {customer360.notification_preferences.whatsapp_marketing ? "On" : "Off"}
                </p>
                <p>
                  WhatsApp order updates:{" "}
                  {customer360.notification_preferences.whatsapp_order_updates ? "On" : "Off"}
                </p>
                <p>
                  Last notification:{" "}
                  {customer360.notification_summary?.last_notification_at
                    ? formatDateTime(customer360.notification_summary.last_notification_at)
                    : "-"}
                </p>
                <p>
                  Total sent jobs: {customer360.notification_summary?.total ?? 0}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
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
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          {order.payment_method ? ` - ${order.payment_method.label}` : ""}
                        </p>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                    </div>

                    {order.shipping_address ? (
                      <div className="mt-2 pt-2 border-t border-[#111]/5">
                        <p className="text-xs text-[#6E6E6E]">
                          <span className="font-medium">Ship to:</span>{" "}
                          {[
                            order.shipping_address.line1,
                            order.shipping_address.city,
                            order.shipping_address.postal_code,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {order.contact_phone ? (
                          <p className="text-xs text-[#6E6E6E]">
                            <span className="font-medium">Phone:</span> {order.contact_phone}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-[#6E6E6E]" />
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
                Support Tickets
              </p>
            </div>
            {customer360 === undefined ? (
              <p className="text-sm text-[#6E6E6E]">Loading support history...</p>
            ) : (customer360?.tickets ?? []).length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No support tickets for this customer.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {(customer360?.tickets ?? []).map((ticket: any) => (
                  <div key={ticket._id} className="border border-[#111]/10 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{ticket.subject}</p>
                        <p className="text-xs text-[#6E6E6E]">{formatDateTime(ticket.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                          {ticket.status}
                        </p>
                        <p className="text-xs text-[#6E6E6E] mt-1">{ticket.priority}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
