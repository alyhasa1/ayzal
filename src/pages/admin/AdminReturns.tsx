import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatPrice } from "@/lib/format";
import { useToast } from "@/components/admin/Toast";

export default function AdminReturns() {
  const returnsQuery = useQuery(api.returns.adminList);
  const approveReturn = useMutation(api.returns.approveReturn);
  const receiveReturn = useMutation(api.returns.receiveReturn);
  const issueRefund = useMutation(api.returns.issueRefund);
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const returnRows = returnsQuery ?? [];
    if (!statusFilter) return returnRows;
    return returnRows.filter((ret: any) => ret.status === statusFilter);
  }, [returnsQuery, statusFilter]);

  const autoRefundAmount = (ret: any) =>
    (ret.items ?? []).reduce((sum: number, item: any) => sum + (item.refund_amount ?? 0), 0);

  const runAction = async (retId: string, action: () => Promise<void>) => {
    setBusyId(retId);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">Returns Queue</h2>
        <div className="inline-flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-[#6E6E6E]">Filter</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="border border-[#111]/10 px-3 py-2 text-sm bg-white"
          >
            <option value="">All statuses</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="received">Received</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-[#111]/10 p-6 text-sm text-[#6E6E6E]">
          No returns in this view.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ret: any) => {
            const suggestedAmount = autoRefundAmount(ret);
            const entered = refundAmounts[ret._id];
            const refundAmount = entered ? Number(entered) : suggestedAmount;

            return (
              <article key={ret._id} className="bg-white border border-[#111]/10 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">Return #{ret._id}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      Order {ret.order?.order_number ?? ret.order_id} •{" "}
                      {new Date(ret.requested_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                    {ret.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-[#6E6E6E]">
                  <p>Resolution: {ret.resolution}</p>
                  <p>Items: {(ret.items ?? []).length}</p>
                  <p>Suggested Refund: {formatPrice(suggestedAmount)}</p>
                </div>

                {ret.reason ? (
                  <p className="text-sm text-[#6E6E6E] border border-[#111]/10 p-2 bg-[#111]/5">
                    Reason: {ret.reason}
                  </p>
                ) : null}

                <div className="space-y-1">
                  {(ret.items ?? []).map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between text-sm">
                      <p>
                        Item {item.order_item_id} • Qty {item.quantity}
                      </p>
                      <p>{formatPrice(item.refund_amount ?? 0)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#111]/10">
                  {ret.status === "requested" ? (
                    <button
                      className="btn-primary text-xs px-4 py-2"
                      disabled={busyId === ret._id}
                      onClick={() =>
                        runAction(ret._id, async () => {
                          try {
                            await approveReturn({ id: ret._id });
                            toast("Return approved");
                          } catch (error: any) {
                            toast(error?.message ?? "Unable to approve return", "error");
                          }
                        })
                      }
                    >
                      {busyId === ret._id ? "Processing..." : "Approve"}
                    </button>
                  ) : null}

                  {ret.status === "approved" ? (
                    <button
                      className="btn-primary text-xs px-4 py-2"
                      disabled={busyId === ret._id}
                      onClick={() =>
                        runAction(ret._id, async () => {
                          try {
                            await receiveReturn({ id: ret._id });
                            toast("Marked as received");
                          } catch (error: any) {
                            toast(error?.message ?? "Unable to update return", "error");
                          }
                        })
                      }
                    >
                      {busyId === ret._id ? "Processing..." : "Mark Received"}
                    </button>
                  ) : null}

                  {(ret.status === "approved" || ret.status === "received") && (
                    <>
                      <input
                        type="number"
                        min={0}
                        value={entered ?? String(suggestedAmount)}
                        onChange={(event) =>
                          setRefundAmounts((prev) => ({
                            ...prev,
                            [ret._id]: event.target.value,
                          }))
                        }
                        className="border border-[#111]/10 px-3 py-2 text-sm w-40"
                      />
                      <button
                        className="border border-[#111]/10 px-3 py-2 text-xs uppercase tracking-widest hover:border-[#D4A05A]"
                        disabled={busyId === ret._id}
                        onClick={() =>
                          runAction(ret._id, async () => {
                            if (!Number.isFinite(refundAmount) || refundAmount < 0) {
                              toast("Enter a valid refund amount", "error");
                              return;
                            }
                            try {
                              await issueRefund({
                                id: ret._id,
                                amount: refundAmount,
                              });
                              toast("Refund issued");
                            } catch (error: any) {
                              toast(error?.message ?? "Unable to issue refund", "error");
                            }
                          })
                        }
                      >
                        {busyId === ret._id ? "Processing..." : "Issue Refund"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
