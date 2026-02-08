import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type RangePreset = "7" | "30" | "90" | "custom";

function toDateTimeInput(timestamp: number) {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toTimestamp(value: string, fallback: number) {
  if (!value) return fallback;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return fallback;
  return timestamp;
}

function formatRangeTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-PK", { day: "numeric", month: "short" });
}

export default function AdminAnalytics() {
  const initialNow = useMemo(() => Date.now(), []);
  const [preset, setPreset] = useState<RangePreset>("30");
  const [customFrom, setCustomFrom] = useState(() =>
    toDateTimeInput(initialNow - 30 * 24 * 60 * 60 * 1000)
  );
  const [customTo, setCustomTo] = useState(() => toDateTimeInput(initialNow));

  const range = useMemo(() => {
    const now = Date.now();
    if (preset === "custom") {
      const from = toTimestamp(customFrom, now - 30 * 24 * 60 * 60 * 1000);
      const to = toTimestamp(customTo, now);
      return {
        from: Math.min(from, to),
        to: Math.max(from, to),
      };
    }

    const days = Number(preset);
    return {
      from: now - days * 24 * 60 * 60 * 1000,
      to: now,
    };
  }, [preset, customFrom, customTo]);

  const dashboard = useQuery(api.analytics.adminDashboard, range);
  const summary = useQuery(api.analytics.adminSummary, range);

  const topEvents = useMemo(() => {
    const byEvent = summary?.byEvent ?? {};
    return Object.entries(byEvent).sort((a, b) => b[1] - a[1]);
  }, [summary]);

  const maxDailyCount = useMemo(() => {
    const rows = dashboard?.daily_events ?? [];
    if (rows.length === 0) return 1;
    return Math.max(...rows.map((row) => row.count), 1);
  }, [dashboard]);

  const funnelRows = useMemo(() => {
    const funnel = dashboard?.funnel ?? {};
    return [
      { key: "product_viewed", label: "Product Viewed", value: funnel.product_viewed ?? 0 },
      { key: "cart_item_added", label: "Add To Cart", value: funnel.cart_item_added ?? 0 },
      { key: "checkout_started", label: "Checkout Started", value: funnel.checkout_started ?? 0 },
      {
        key: "checkout_completed",
        label: "Checkout Completed",
        value: funnel.checkout_completed ?? 0,
      },
    ];
  }, [dashboard]);

  const funnelTop = Math.max(...funnelRows.map((row) => row.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl">Analytics</h2>
          <p className="text-sm text-[#6E6E6E]">
            Funnel activity, sources, and behavior trends in one place.
          </p>
          <p className="text-xs text-[#6E6E6E] mt-1">
            Range: {formatRangeTimestamp(range.from)} to {formatRangeTimestamp(range.to)}
          </p>
        </div>
        <div className="inline-flex border border-[#111]/10 bg-white">
          {[
            { key: "7", label: "7D" },
            { key: "30", label: "30D" },
            { key: "90", label: "90D" },
            { key: "custom", label: "Custom" },
          ].map((item) => (
            <button
              key={item.key}
              className={`px-3 py-2 text-xs uppercase tracking-widest ${
                preset === item.key ? "bg-[#111] text-white" : "text-[#111] hover:bg-[#111]/5"
              }`}
              onClick={() => setPreset(item.key as RangePreset)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {preset === "custom" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            From
            <input
              type="datetime-local"
              className="w-full border border-[#111]/10 bg-white px-3 py-2 mt-1 text-sm"
              value={customFrom}
              onChange={(event) => setCustomFrom(event.target.value)}
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            To
            <input
              type="datetime-local"
              className="w-full border border-[#111]/10 bg-white px-3 py-2 mt-1 text-sm"
              value={customTo}
              onChange={(event) => setCustomTo(event.target.value)}
            />
          </label>
        </div>
      ) : null}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="bg-white border border-[#111]/10 p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Total Events</p>
          <p className="font-display text-xl">{dashboard?.total_events ?? "-"}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Checkout Started</p>
          <p className="font-display text-xl">{dashboard?.funnel?.checkout_started ?? "-"}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Checkout Completed</p>
          <p className="font-display text-xl">{dashboard?.funnel?.checkout_completed ?? "-"}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Completion Rate</p>
          <p className="font-display text-xl">
            {dashboard ? `${dashboard.checkout_completion_rate}%` : "-"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#111]/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Daily Event Volume</h3>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
              {dashboard?.daily_events.length ?? 0} days
            </p>
          </div>
          {!dashboard ? (
            <p className="text-sm text-[#6E6E6E]">Loading analytics data...</p>
          ) : dashboard.daily_events.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No events in this range.</p>
          ) : (
            <div className="space-y-2">
              {dashboard.daily_events.map((row) => (
                <div key={row.day} className="flex items-center gap-3">
                  <p className="w-16 text-xs text-[#6E6E6E]">{formatDay(row.day)}</p>
                  <div className="flex-1 h-2 bg-[#111]/5">
                    <div
                      className="h-2 bg-[#D4A05A]"
                      style={{ width: `${Math.max((row.count / maxDailyCount) * 100, 2)}%` }}
                    />
                  </div>
                  <p className="w-10 text-right text-xs text-[#6E6E6E]">{row.count}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white border border-[#111]/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg">Top Events</h3>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
              {summary?.total ?? 0} tracked
            </p>
          </div>
          {topEvents.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No event breakdown available.</p>
          ) : (
            <div className="space-y-2">
              {topEvents.slice(0, 12).map(([event, count]) => {
                const total = summary?.total ?? 0;
                const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";
                return (
                  <div
                    key={event}
                    className="flex items-center justify-between border border-[#111]/10 p-2"
                  >
                    <p className="text-sm">{event}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {count} ({pct}%)
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#111]/10 p-5 space-y-3">
          <h3 className="font-display text-lg">Top Paths</h3>
          {!dashboard ? (
            <p className="text-sm text-[#6E6E6E]">Loading paths...</p>
          ) : dashboard.top_paths.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No path data yet.</p>
          ) : (
            dashboard.top_paths.map((row) => (
              <div key={row.path} className="flex items-center justify-between text-sm">
                <p className="font-mono break-all pr-3">{row.path}</p>
                <p className="text-[#6E6E6E]">{row.count}</p>
              </div>
            ))
          )}
        </section>

        <section className="bg-white border border-[#111]/10 p-5 space-y-3">
          <h3 className="font-display text-lg">Top Referrers</h3>
          {!dashboard ? (
            <p className="text-sm text-[#6E6E6E]">Loading referrers...</p>
          ) : dashboard.top_referrers.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No referrer data yet.</p>
          ) : (
            dashboard.top_referrers.map((row) => (
              <div key={row.referrer} className="flex items-center justify-between text-sm">
                <p className="break-all pr-3">{row.referrer}</p>
                <p className="text-[#6E6E6E]">{row.count}</p>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="bg-white border border-[#111]/10 p-5 space-y-3">
        <h3 className="font-display text-lg">Funnel</h3>
        <div className="space-y-2">
          {funnelRows.map((row) => (
            <div key={row.key} className="flex items-center gap-3">
              <p className="w-44 text-sm text-[#6E6E6E]">{row.label}</p>
              <div className="flex-1 h-2 bg-[#111]/5">
                <div
                  className="h-2 bg-[#111]"
                  style={{ width: `${Math.max((row.value / funnelTop) * 100, 2)}%` }}
                />
              </div>
              <p className="w-12 text-right text-xs text-[#6E6E6E]">{row.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
