import { useState } from "react";
import { useParams } from "@remix-run/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatPrice } from "@/lib/format";

export default function ReturnDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [guestEmail, setGuestEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const ret = useQuery(
    api.returns.getByIdForUser,
    id
      ? {
          id: id as any,
          guest_email: submitted ? guestEmail || undefined : undefined,
        }
      : "skip"
  );

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-[#111]/10 p-6 space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Return Tracking</p>
          <h1 className="font-display text-2xl">Return Request</h1>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="flex-1 border border-[#111]/10 px-3 py-2"
              placeholder="Enter order email if prompted"
            />
            <button className="border border-[#111]/10 px-4 py-2 text-sm" type="submit">
              Verify
            </button>
          </form>
        </div>

        {ret === undefined ? (
          <div className="bg-white border border-[#111]/10 p-6 text-sm text-[#6E6E6E]">
            Loading return details...
          </div>
        ) : null}

        {ret === null ? (
          <div className="bg-white border border-[#111]/10 p-6 text-sm text-red-500">
            Return not found or verification required.
          </div>
        ) : null}

        {ret ? (
          <div className="bg-white border border-[#111]/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Return #{ret._id}</p>
              <span className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                {ret.status}
              </span>
            </div>

            <div className="space-y-2">
              {ret.items.map((item: any) => (
                <div key={item._id} className="flex items-center justify-between text-sm">
                  <p>
                    Item {item.order_item_id} x {item.quantity}
                  </p>
                  <p>{formatPrice(item.refund_amount ?? 0)}</p>
                </div>
              ))}
            </div>

            <div className="border border-[#111]/10 p-4">
              <p className="text-xs uppercase tracking-widest text-[#6E6E6E] mb-2">Timeline</p>
              <div className="space-y-2">
                {ret.events.map((event: any) => (
                  <div key={event._id} className="text-sm">
                    <p className="font-medium">{event.status}</p>
                    {event.note ? (
                      <p className="text-xs text-[#6E6E6E]">{event.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
