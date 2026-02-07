import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link } from "@remix-run/react";
import { api } from "../../../convex/_generated/api";

type PreferenceState = {
  email_marketing: boolean;
  email_order_updates: boolean;
  email_review_requests: boolean;
  whatsapp_marketing: boolean;
  whatsapp_order_updates: boolean;
  whatsapp_review_requests: boolean;
  timezone: string;
  quiet_hours_start: string;
  quiet_hours_end: string;
};

function emptyState(): PreferenceState {
  return {
    email_marketing: false,
    email_order_updates: true,
    email_review_requests: true,
    whatsapp_marketing: false,
    whatsapp_order_updates: true,
    whatsapp_review_requests: false,
    timezone: "",
    quiet_hours_start: "",
    quiet_hours_end: "",
  };
}

function statusClass(status?: string) {
  if (!status) return "border-[#111]/10 text-[#6E6E6E]";
  const value = status.toLowerCase();
  if (value === "sent" || value === "delivered") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value === "failed") {
    return "border-red-200 bg-red-50 text-red-600";
  }
  if (value === "queued" || value === "running") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-[#111]/10 text-[#6E6E6E]";
}

export default function AccountNotificationsPage() {
  const user = useQuery(api.users.me);
  const profile = useQuery(api.userProfiles.get);
  const preferences = useQuery(api.notifications.getMine);

  const [activityChannel, setActivityChannel] = useState("");
  const [activityStatus, setActivityStatus] = useState("");
  const activity = useQuery(api.notifications.listMyActivity, {
    channel: activityChannel || undefined,
    status: activityStatus || undefined,
    limit: 40,
  });

  const updateMine = useMutation(api.notifications.updateMine);

  const [form, setForm] = useState<PreferenceState>(emptyState());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!preferences) return;
    setForm({
      email_marketing: preferences.email_marketing,
      email_order_updates: preferences.email_order_updates,
      email_review_requests: preferences.email_review_requests,
      whatsapp_marketing: preferences.whatsapp_marketing,
      whatsapp_order_updates: preferences.whatsapp_order_updates,
      whatsapp_review_requests: preferences.whatsapp_review_requests,
      timezone: preferences.timezone ?? "",
      quiet_hours_start: preferences.quiet_hours_start ?? "",
      quiet_hours_end: preferences.quiet_hours_end ?? "",
    });
  }, [preferences]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl">Notification Preferences</h2>
        <p className="text-sm text-[#6E6E6E]">
          Control which updates you receive and review your recent notification activity.
        </p>
      </div>

      <div className="bg-white border border-[#111]/10 p-5 space-y-3">
        <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Contact Channels</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="border border-[#111]/10 p-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Email</p>
            <p className="font-medium break-all">{user?.email || "No email found"}</p>
          </div>
          <div className="border border-[#111]/10 p-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">WhatsApp Number</p>
            <p className="font-medium">{profile?.phone || "No phone on profile"}</p>
            {!profile?.phone ? (
              <Link
                to="/account/profile"
                className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
              >
                Add phone in profile
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <form
        className="bg-white border border-[#111]/10 p-5 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setSaved(false);
          try {
            await updateMine({
              email_marketing: form.email_marketing,
              email_order_updates: form.email_order_updates,
              email_review_requests: form.email_review_requests,
              whatsapp_marketing: form.whatsapp_marketing,
              whatsapp_order_updates: form.whatsapp_order_updates,
              whatsapp_review_requests: form.whatsapp_review_requests,
              timezone: form.timezone || undefined,
              quiet_hours_start: form.quiet_hours_start || undefined,
              quiet_hours_end: form.quiet_hours_end || undefined,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Email Notifications</p>
            <label className="flex items-center justify-between gap-3 border border-[#111]/10 p-3 text-sm">
              <span>Promotions and campaigns</span>
              <input
                type="checkbox"
                checked={form.email_marketing}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email_marketing: event.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3 border border-[#111]/10 p-3 text-sm">
              <span>Order and delivery updates</span>
              <input
                type="checkbox"
                checked={form.email_order_updates}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email_order_updates: event.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3 border border-[#111]/10 p-3 text-sm">
              <span>Review and feedback requests</span>
              <input
                type="checkbox"
                checked={form.email_review_requests}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email_review_requests: event.target.checked }))
                }
              />
            </label>
          </section>

          <section className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">
              WhatsApp Notifications
            </p>
            <label className="flex items-center justify-between gap-3 border border-[#111]/10 p-3 text-sm">
              <span>Promotions and campaigns</span>
              <input
                type="checkbox"
                checked={form.whatsapp_marketing}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, whatsapp_marketing: event.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3 border border-[#111]/10 p-3 text-sm">
              <span>Order and delivery updates</span>
              <input
                type="checkbox"
                checked={form.whatsapp_order_updates}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, whatsapp_order_updates: event.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3 border border-[#111]/10 p-3 text-sm">
              <span>Review and feedback requests</span>
              <input
                type="checkbox"
                checked={form.whatsapp_review_requests}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, whatsapp_review_requests: event.target.checked }))
                }
              />
            </label>
          </section>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            Timezone
            <input
              className="w-full border border-[#111]/10 px-3 py-2 text-sm mt-1"
              value={form.timezone}
              onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              placeholder="Asia/Karachi"
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            Quiet Hours Start
            <input
              className="w-full border border-[#111]/10 px-3 py-2 text-sm mt-1"
              value={form.quiet_hours_start}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, quiet_hours_start: event.target.value }))
              }
              placeholder="22:00"
            />
          </label>
          <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
            Quiet Hours End
            <input
              className="w-full border border-[#111]/10 px-3 py-2 text-sm mt-1"
              value={form.quiet_hours_end}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, quiet_hours_end: event.target.value }))
              }
              placeholder="08:00"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          {saved ? <span className="text-xs uppercase tracking-widest text-[#6E6E6E]">Saved</span> : null}
        </div>
      </form>

      <section className="bg-white border border-[#111]/10 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg">Recent Notification Activity</h3>
            <p className="text-xs text-[#6E6E6E]">Latest sends and status updates for your account</p>
          </div>
          <div className="flex gap-2">
            <select
              className="border border-[#111]/10 px-3 py-2 text-sm bg-white"
              value={activityChannel}
              onChange={(event) => setActivityChannel(event.target.value)}
            >
              <option value="">All channels</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <select
              className="border border-[#111]/10 px-3 py-2 text-sm bg-white"
              value={activityStatus}
              onChange={(event) => setActivityStatus(event.target.value)}
            >
              <option value="">All statuses</option>
              <option value="queued">Queued</option>
              <option value="running">Running</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {activity === undefined ? (
          <p className="text-sm text-[#6E6E6E]">Loading notification activity...</p>
        ) : activity.length === 0 ? (
          <p className="text-sm text-[#6E6E6E]">No activity found for this filter.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((row: any) => (
              <article key={row._id} className="border border-[#111]/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {row.template_name || row.template_key || "Notification"}
                    </p>
                    <p className="text-xs text-[#6E6E6E]">
                      {row.channel} {row.campaign_name ? `- ${row.campaign_name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-widest border px-2 py-1 ${statusClass(
                      row.status
                    )}`}
                  >
                    {row.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-[#6E6E6E] grid grid-cols-1 md:grid-cols-3 gap-2">
                  <p>Recipient: {row.recipient}</p>
                  <p>Last event: {row.latest_event || "n/a"}</p>
                  <p>
                    Updated: {row.updated_at ? new Date(row.updated_at).toLocaleString() : "n/a"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
