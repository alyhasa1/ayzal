import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "@remix-run/react";
import { api } from "../../../convex/_generated/api";
import { formatOrderNumber, formatPrice } from "@/lib/format";
import { StatusBadge } from "@/components/OrderTimeline";
import { Search, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";

const STATUS_TABS = [
  "all",
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminOrders() {
  const ordersQuery = useQuery(api.orders.listAll);
  const deleteAccess = useQuery(api.orders.adminDeleteAccess);
  const deleteManyOrders = useMutation(api.orders.adminDeleteMany);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [confirmBulkDeleteOpen, setConfirmBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canDeleteOrders = deleteAccess?.allowed ?? false;

  const filteredOrders = useMemo(() => {
    let list = ordersQuery ?? [];
    if (activeTab !== "all") {
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
  }, [ordersQuery, activeTab, searchQuery]);

  const statusCounts = useMemo(() => {
    const orderRows = ordersQuery ?? [];
    const counts: Record<string, number> = { all: orderRows.length };
    for (const o of orderRows) {
      counts[o.status] = (counts[o.status] ?? 0) + 1;
    }
    return counts;
  }, [ordersQuery]);

  const selectedSet = useMemo(() => new Set(selectedOrderIds), [selectedOrderIds]);
  const filteredOrderIds = useMemo(
    () => filteredOrders.map((order) => String(order._id)),
    [filteredOrders]
  );
  const selectedVisibleCount = useMemo(
    () => filteredOrderIds.filter((id) => selectedSet.has(id)).length,
    [filteredOrderIds, selectedSet]
  );
  const allVisibleSelected =
    filteredOrderIds.length > 0 && selectedVisibleCount === filteredOrderIds.length;

  useEffect(() => {
    const validIds = new Set((ordersQuery ?? []).map((order) => String(order._id)));
    setSelectedOrderIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [ordersQuery]);

  useEffect(() => {
    if (!canDeleteOrders && selectedOrderIds.length > 0) {
      setSelectedOrderIds([]);
    }
  }, [canDeleteOrders, selectedOrderIds.length]);

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleVisibleSelection = () => {
    if (filteredOrderIds.length === 0) return;
    if (allVisibleSelected) {
      const visible = new Set(filteredOrderIds);
      setSelectedOrderIds((prev) => prev.filter((id) => !visible.has(id)));
      return;
    }
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      for (const id of filteredOrderIds) {
        next.add(id);
      }
      return Array.from(next);
    });
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    setDeleting(true);
    try {
      const response = (await deleteManyOrders({
        ids: selectedOrderIds as any,
      })) as {
        deleted: number;
        missing: number;
      };
      setSelectedOrderIds([]);
      setConfirmBulkDeleteOpen(false);

      if (response.deleted > 0) {
        toast(`Deleted ${response.deleted} order(s)`, "success");
      } else {
        toast("No orders were deleted", "info");
      }
      if (response.missing > 0) {
        toast(`${response.missing} order(s) were already missing`, "info");
      }
    } catch (error: any) {
      toast(error?.message ?? "Unable to delete selected orders", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">Orders</h2>
        <div className="flex flex-wrap items-center gap-2">
          {canDeleteOrders && (
            <>
              <button
                type="button"
                className="px-3 py-1.5 text-xs uppercase tracking-widest border border-[#111]/10 text-[#6E6E6E] hover:text-[#111] hover:border-[#111]/30 transition-colors"
                onClick={toggleVisibleSelection}
              >
                {allVisibleSelected ? "Unselect Visible" : "Select Visible"}
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-xs uppercase tracking-widest border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                disabled={selectedOrderIds.length === 0 || deleting}
                onClick={() => setConfirmBulkDeleteOpen(true)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedOrderIds.length})
              </button>
            </>
          )}
          <span className="text-xs text-[#6E6E6E]">{filteredOrders.length} orders</span>
        </div>
      </div>

      {deleteAccess && !deleteAccess.allowed ? (
        <p className="text-xs text-[#6E6E6E]">
          Delete access disabled: {deleteAccess.reason}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs uppercase tracking-widest border transition-colors ${
              activeTab === tab
                ? "bg-[#111] text-white border-[#111]"
                : "border-[#111]/10 text-[#6E6E6E] hover:text-[#111] hover:border-[#111]/30"
            }`}
          >
            {tab} {statusCounts[tab] ? `(${statusCounts[tab]})` : ""}
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
        {filteredOrders.map((order) => {
          const orderId = String(order._id);
          const selected = selectedSet.has(orderId);
          return (
            <div
              key={order._id}
              className={`relative bg-white border transition-colors ${
                selected
                  ? "border-[#D4A05A]"
                  : "border-[#111]/10 hover:border-[#D4A05A]/40"
              }`}
            >
              {canDeleteOrders ? (
                <label className="absolute left-3 top-3 z-10 inline-flex items-center gap-2 text-xs text-[#6E6E6E]">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleOrderSelection(orderId)}
                    className="h-4 w-4 accent-[#111]"
                    aria-label={`Select order ${formatOrderNumber(order)}`}
                  />
                </label>
              ) : null}

              <Link
                to={`/admin/orders/${order._id}`}
                className={`block p-4 ${canDeleteOrders ? "pl-11" : ""}`}
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
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                    </p>
                    {order.payment_method ? (
                      <p className="text-xs text-[#6E6E6E]">{order.payment_method.label}</p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <p className="text-sm text-[#6E6E6E] py-8 text-center">No orders found.</p>
        )}
      </div>

      <ConfirmDialog
        open={confirmBulkDeleteOpen}
        title="Delete Selected Orders"
        message={`Delete ${selectedOrderIds.length} selected order(s)? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => {
          if (!deleting) setConfirmBulkDeleteOpen(false);
        }}
      />
    </div>
  );
}
