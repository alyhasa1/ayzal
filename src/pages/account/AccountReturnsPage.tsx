import { Link } from "@remix-run/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatPrice } from "@/lib/format";

export default function AccountReturnsPage() {
  const returns = useQuery(api.returns.listForUser) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">My Returns</h2>
        <Link to="/returns/new" className="btn-primary text-xs px-4 py-2">
          Start Return
        </Link>
      </div>

      {returns.length === 0 ? (
        <div className="bg-white border border-[#111]/10 p-6 text-center space-y-3">
          <p className="text-sm text-[#6E6E6E]">No return requests yet.</p>
          <Link to="/returns/new" className="btn-primary inline-block">
            Start a Return
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((ret: any) => {
            const refundable = (ret.items ?? []).reduce(
              (sum: number, item: any) => sum + (item.refund_amount ?? 0),
              0
            );
            return (
              <article key={ret._id} className="bg-white border border-[#111]/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Return #{ret._id}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      Requested {new Date(ret.requested_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                    {ret.status}
                  </span>
                </div>

                <div className="text-xs text-[#6E6E6E] grid grid-cols-1 md:grid-cols-3 gap-2">
                  <p>Order: {ret.order?.order_number ?? ret.order_id}</p>
                  <p>Items: {(ret.items ?? []).length}</p>
                  <p>Potential Refund: {formatPrice(refundable)}</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#6E6E6E]">
                    Resolution: {ret.resolution}
                    {ret.reason ? ` • Reason: ${ret.reason}` : ""}
                  </p>
                  <Link
                    to={`/returns/${ret._id}`}
                    className="text-xs uppercase tracking-widest border border-[#111]/10 px-2 py-1 hover:border-[#D4A05A]"
                  >
                    View Detail
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
