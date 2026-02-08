import { useMemo, useState } from "react";
import { useNavigate } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGuestToken } from "@/hooks/useGuestToken";

type ReturnQtyMap = Record<string, number>;

export default function ReturnsNewPage() {
  const navigate = useNavigate();
  const guestToken = useGuestToken();
  const requestReturn = useMutation(api.returns.requestReturn);

  const [orderNumber, setOrderNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [resolution, setResolution] = useState("refund");
  const [reason, setReason] = useState("");
  const [lookup, setLookup] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [lineQty, setLineQty] = useState<ReturnQtyMap>({});

  const lookupArgs =
    lookup && orderNumber
      ? {
          order_number: orderNumber.trim(),
          guest_token: guestToken || undefined,
          contact_email: contactEmail.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
        }
      : "skip";
  const order = useQuery(api.orders.getByOrderNumber, lookupArgs);

  const selectedItems = useMemo(() => {
    if (!order) return [];
    return order.items
      .map((item) => ({
        order_item_id: item._id,
        quantity: lineQty[item._id] ?? 0,
      }))
      .filter((item) => item.quantity > 0);
  }, [order, lineQty]);

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-1xl mx-auto space-y-6">
        <div className="bg-white border border-[#111]/10 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Returns</p>
            <h1 className="font-display text-xl mt-1">Start a Return</h1>
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setLookup(true);
              setStatus(null);
            }}
          >
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full border border-[#111]/10 px-3 py-2"
              placeholder="Order number"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full border border-[#111]/10 px-3 py-2"
                placeholder="Email"
                required={!contactPhone}
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full border border-[#111]/10 px-3 py-2"
                placeholder="Phone"
                required={!contactEmail}
              />
            </div>
            <button className="btn-primary w-full" type="submit">
              Find Order
            </button>
          </form>

          {lookup && order === undefined ? (
            <p className="text-sm text-[#6E6E6E]">Looking up order...</p>
          ) : null}
          {lookup && order === null ? (
            <p className="text-sm text-red-500">Order not found for provided details.</p>
          ) : null}
        </div>

        {order ? (
          <form
            className="bg-white border border-[#111]/10 p-6 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setStatus(null);
              if (selectedItems.length === 0) {
                setStatus("Select at least one item quantity to return.");
                return;
              }
              try {
                const id = await requestReturn({
                  order_id: order._id,
                  guest_email: contactEmail || undefined,
                  reason: reason || undefined,
                  resolution,
                  items: selectedItems.map((item) => ({
                    order_item_id: item.order_item_id,
                    quantity: item.quantity,
                  })),
                });
                navigate(`/returns/${id}`);
              } catch (error: unknown) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Unable to submit return request";
                setStatus(message);
              }
            }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Order found</p>
              <p className="text-sm mt-1">{order.order_number ?? order._id}</p>
            </div>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item._id} className="border border-[#111]/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <p className="text-xs text-[#6E6E6E]">Ordered qty: {item.quantity}</p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={item.quantity}
                      value={lineQty[item._id] ?? 0}
                      onChange={(e) =>
                        setLineQty((prev) => ({
                          ...prev,
                          [item._id]: Number(e.target.value),
                        }))
                      }
                      className="w-20 border border-[#111]/10 px-2 py-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              className="w-full border border-[#111]/10 px-3 py-2"
            >
              <option value="refund">Refund</option>
              <option value="exchange">Exchange</option>
            </select>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-[#111]/10 px-3 py-2 min-h-20"
              placeholder="Reason for return (optional)"
            />
            {status && <p className="text-xs text-[#6E6E6E]">{status}</p>}
            <button className="btn-primary w-full" type="submit">
              Submit Return Request
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
