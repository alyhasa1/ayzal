import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from '@remix-run/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { formatOrderNumber, formatPrice } from '@/lib/format';
import { StatusBadge } from '@/components/OrderTimeline';
import OrderTimeline from '@/components/OrderTimeline';
import FormField, { fieldInputClass, fieldSelectClass } from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { ArrowLeft, Printer, Trash2 } from 'lucide-react';

const statusOptions = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = useQuery(
    api.orders.adminGetById,
    id ? { id: id as Id<'orders'> } : 'skip'
  );
  const deleteAccess = useQuery(api.orders.adminDeleteAccess);
  const adminUpdate = useMutation(api.orders.adminUpdate);
  const adminDelete = useMutation(api.orders.adminDelete);
  const { toast } = useToast();

  const [status, setStatus] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [syncKey, setSyncKey] = useState(0);

  const canDeleteOrder = deleteAccess?.allowed ?? false;

  useEffect(() => {
    if (order) {
      setStatus(order.status ?? 'pending');
      setTrackingCarrier(order.tracking_carrier ?? '');
      setTrackingNumber(order.tracking_number ?? '');
      setTrackingUrl(order.tracking_url ?? '');
    }
  }, [order, syncKey]);

  if (order === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#6E6E6E]">Order not found.</p>
        <Link to="/admin/orders" className="btn-primary inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#6E6E6E]">Loading...</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = { id: order._id };
      if (status !== order.status) updates.status = status;
      if (trackingCarrier !== (order.tracking_carrier ?? ''))
        updates.tracking_carrier = trackingCarrier;
      if (trackingNumber !== (order.tracking_number ?? ''))
        updates.tracking_number = trackingNumber;
      if (trackingUrl !== (order.tracking_url ?? ''))
        updates.tracking_url = trackingUrl;
      if (note.trim()) updates.note = note.trim();

      if (Object.keys(updates).length === 1) {
        toast('No changes to save', 'info');
        setSaving(false);
        return;
      }

      await adminUpdate(updates);
      toast('Order updated');
      setNote('');
      setSyncKey((k) => k + 1);
    } catch (err: any) {
      toast(err?.message ?? 'Failed to update order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = (await adminDelete({ id: order._id })) as { deleted: boolean };
      if (!result?.deleted) {
        toast('Order was already deleted', 'info');
      } else {
        toast('Order deleted');
      }
      navigate('/admin/orders');
    } catch (err: any) {
      toast(err?.message ?? 'Failed to delete order', 'error');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 border border-[#111]/10 hover:border-[#D4A05A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl">
                #{formatOrderNumber(order)}
              </h2>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-[#6E6E6E]">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-xs border border-[#111]/10 hover:border-[#D4A05A] transition-colors"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          {canDeleteOrder ? (
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 text-xs border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Order
            </button>
          ) : null}
        </div>
      </div>

      {deleteAccess && !deleteAccess.allowed ? (
        <p className="text-xs text-[#6E6E6E]">{deleteAccess.reason}</p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Customer
            </p>
            <div className="space-y-1 text-sm">
              <p>{order.contact_email}</p>
              <p>{order.contact_phone}</p>
            </div>
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Shipping Address
            </p>
            <div className="space-y-1 text-sm">
              {order.shipping_address?.line1 && (
                <p>{order.shipping_address.line1}</p>
              )}
              {order.shipping_address?.line2 && (
                <p>{order.shipping_address.line2}</p>
              )}
              <p>
                {[
                  order.shipping_address?.city,
                  order.shipping_address?.state,
                  order.shipping_address?.postal_code,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </p>
              {order.shipping_address?.country && (
                <p>{order.shipping_address.country}</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Items
            </p>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item._id} className="flex items-center gap-3">
                  <div className="w-10 h-10 flex-shrink-0 bg-gray-100 overflow-hidden border border-[#111]/5">
                    {item.product_image_url && (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-[#6E6E6E]">
                      {formatPrice(item.unit_price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium flex-shrink-0">
                    {formatPrice(item.line_total)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-[#111]/10 pt-3 flex items-center justify-between">
              <span className="text-sm text-[#6E6E6E]">Total</span>
              <span className="text-sm font-semibold">
                {formatPrice(order.total)}
              </span>
            </div>
            {order.payment_method && (
              <p className="text-xs text-[#6E6E6E]">
                Payment: {order.payment_method.label}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#111]/10 p-5 space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Update Order
            </p>
            <FormField label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={fieldSelectClass}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
            <div className="grid grid-cols-1 gap-3">
              <FormField label="Tracking Carrier" hint="e.g. TCS, Leopards, Pakistan Post">
                <input
                  value={trackingCarrier}
                  onChange={(e) => setTrackingCarrier(e.target.value)}
                  className={fieldInputClass}
                />
              </FormField>
              <FormField label="Tracking Number">
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className={fieldInputClass}
                />
              </FormField>
              <FormField label="Tracking URL" hint="Optional link for customer to track">
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className={fieldInputClass}
                />
              </FormField>
            </div>
            <FormField label="Note" hint="Visible in timeline">
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={fieldInputClass}
              />
            </FormField>
            <button
              type="button"
              className="btn-primary w-full"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          <div className="bg-white border border-[#111]/10 p-5 space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">
              Timeline
            </p>
            <OrderTimeline events={order.status_events} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Order"
        message={`Delete #${formatOrderNumber(order)}? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => {
          if (!deleting) setDeleteConfirmOpen(false);
        }}
      />
    </div>
  );
}
