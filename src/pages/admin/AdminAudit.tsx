import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormField, { fieldInputClass } from "@/components/admin/FormField";

function parseDateValue(value: string) {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export default function AdminAudit() {
  const [actorEmail, setActorEmail] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState("150");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const args = useMemo(
    () => ({
      actor_email: actorEmail.trim() || undefined,
      action: action.trim() || undefined,
      entity_type: entityType.trim() || undefined,
      from: parseDateValue(fromDate),
      to: parseDateValue(toDate),
      limit: Number(limit || 150),
    }),
    [actorEmail, action, entityType, fromDate, toDate, limit]
  );

  const logs = useQuery(api.audit.adminList, args) ?? [];
  const summary = useQuery(api.audit.adminSummary, {
    from: args.from,
    to: args.to,
  });

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#111]/10 p-6 space-y-4">
        <h2 className="font-display text-xl">Audit Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <FormField label="Actor Email">
            <input
              className={fieldInputClass}
              value={actorEmail}
              onChange={(event) => setActorEmail(event.target.value)}
              placeholder="admin@store.com"
            />
          </FormField>
          <FormField label="Action">
            <input
              className={fieldInputClass}
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="shipping.method.updated"
            />
          </FormField>
          <FormField label="Entity Type">
            <input
              className={fieldInputClass}
              value={entityType}
              onChange={(event) => setEntityType(event.target.value)}
              placeholder="shipping_method"
            />
          </FormField>
          <FormField label="From">
            <input
              className={fieldInputClass}
              type="datetime-local"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </FormField>
          <FormField label="To">
            <input
              className={fieldInputClass}
              type="datetime-local"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </FormField>
          <FormField label="Limit">
            <input
              className={fieldInputClass}
              type="number"
              min={1}
              max={500}
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border border-[#111]/10 p-6 space-y-3">
          <h3 className="font-display text-lg">Activity Snapshot</h3>
          {summary === undefined ? (
            <p className="text-sm text-[#6E6E6E]">Loading summary...</p>
          ) : (
            <>
              <p className="text-sm text-[#6E6E6E]">Total events: {summary.total}</p>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">By Action</p>
                {Object.entries(summary.action_breakdown).length === 0 ? (
                  <p className="text-sm text-[#6E6E6E]">No actions in selected range.</p>
                ) : (
                  Object.entries(summary.action_breakdown).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-sm">
                      <span>{key}</span>
                      <span>{value}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-white border border-[#111]/10 p-6 space-y-4">
        <h3 className="font-display text-lg">Audit Timeline</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-[#6E6E6E]">No logs matched your filters.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log: any) => (
              <article key={log._id} className="border border-[#111]/10 p-3 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {log.entity_type}
                      {log.entity_id ? ` • ${log.entity_id}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6E6E6E]">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-[#6E6E6E]">{log.actor_email ?? "system"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs underline text-[#6E6E6E]"
                  onClick={() => setExpandedId((prev) => (prev === log._id ? null : log._id))}
                >
                  {expandedId === log._id ? "Hide details" : "Show details"}
                </button>
                {expandedId === log._id ? (
                  <pre className="text-xs bg-[#111]/5 border border-[#111]/10 p-3 overflow-auto">
                    {JSON.stringify(
                      {
                        before: log.before,
                        after: log.after,
                        meta: log.meta,
                      },
                      null,
                      2
                    )}
                  </pre>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
