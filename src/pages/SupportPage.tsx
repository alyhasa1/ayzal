import { useEffect, useState } from "react";
import { Link } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const SUPPORT_EMAIL_KEY = "ayzal_support_lookup_email";

export default function SupportPage() {
  const user = useQuery(api.users.me);
  const createTicket = useMutation(api.support.createTicket);

  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setGuestEmail(user.email);
      return;
    }
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(SUPPORT_EMAIL_KEY);
    if (saved) {
      setGuestEmail(saved);
    }
  }, [user?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user?.email) return;
    if (guestEmail.trim()) {
      window.localStorage.setItem(SUPPORT_EMAIL_KEY, guestEmail.trim());
    }
  }, [guestEmail, user?.email]);

  const tickets = useQuery(
    api.support.listMine,
    user?.email ? {} : guestEmail.trim() ? { guest_email: guestEmail.trim() } : "skip"
  );

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8">
        <form
          className="bg-white border border-[#111]/10 p-6 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setStatus(null);
            setSaving(true);
            setLastCreatedId(null);

            if (!user?.email && !guestEmail.trim()) {
              setStatus("Email is required to create a support ticket.");
              setSaving(false);
              return;
            }

            try {
              const id = await createTicket({
                subject: subject.trim(),
                guest_email: user?.email ? undefined : guestEmail.trim(),
                guest_phone: guestPhone.trim() || undefined,
                message: message.trim(),
                channel: "web",
              });
              setSubject("");
              setMessage("");
              setLastCreatedId(String(id));
              setStatus("Support ticket submitted.");
            } catch (err: any) {
              setStatus(err?.message ?? "Unable to submit ticket");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Support</p>
            <h1 className="font-display text-2xl mt-1">Need Help?</h1>
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Email</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
              className="w-full border border-[#111]/10 px-3 py-2"
              readOnly={!!user?.email}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">
              Phone (optional)
            </label>
            <input
              value={guestPhone}
              onChange={(event) => setGuestPhone(event.target.value)}
              className="w-full border border-[#111]/10 px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full border border-[#111]/10 px-3 py-2"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Message</label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full border border-[#111]/10 px-3 py-2 min-h-28"
              required
            />
          </div>

          {status ? <p className="text-xs text-[#6E6E6E]">{status}</p> : null}

          {lastCreatedId ? (
            <Link
              to={`/support/${lastCreatedId}${user?.email ? "" : `?email=${encodeURIComponent(guestEmail.trim())}`}`}
              className="inline-block text-xs uppercase tracking-widest underline"
            >
              Open submitted ticket
            </Link>
          ) : null}

          <button className="btn-primary w-full" type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>

        <div className="bg-white border border-[#111]/10 p-6 space-y-3">
          <h2 className="font-display text-lg">Your Recent Tickets</h2>
          {!user?.email && !guestEmail.trim() ? (
            <p className="text-sm text-[#6E6E6E]">Enter your email to load ticket history.</p>
          ) : tickets === undefined ? (
            <p className="text-sm text-[#6E6E6E]">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No tickets yet.</p>
          ) : (
            tickets.map((ticket: any) => {
              const lastEvent = ticket.events?.[ticket.events.length - 1];
              const ticketHref = `/support/${ticket._id}${
                user?.email ? "" : `?email=${encodeURIComponent(guestEmail.trim())}`
              }`;
              return (
                <article key={ticket._id} className="border border-[#111]/10 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{ticket.subject}</p>
                    <span className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E6E]">
                    Updated {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                  {lastEvent?.note ? <p className="text-sm text-[#6E6E6E]">{lastEvent.note}</p> : null}
                  <Link to={ticketHref} className="text-xs uppercase tracking-widest underline">
                    Open thread
                  </Link>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
