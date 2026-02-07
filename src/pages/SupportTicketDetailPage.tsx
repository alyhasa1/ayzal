import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

function eventLabel(type: string) {
  switch (type) {
    case "created":
      return "Ticket created";
    case "customer_reply":
      return "Your reply";
    case "customer_note":
      return "Support reply";
    case "updated":
      return "Status updated";
    default:
      return type;
  }
}

function eventTone(type: string) {
  if (type === "customer_reply") return "border-[#111]/20 bg-[#111]/[0.03]";
  if (type === "customer_note") return "border-[#D4A05A]/40 bg-[#D4A05A]/10";
  if (type === "updated") return "border-[#111]/10 bg-white";
  return "border-[#111]/10 bg-white";
}

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useQuery(api.users.me);
  const addReply = useMutation(api.support.addCustomerReply);

  const [emailInput, setEmailInput] = useState(searchParams.get("email") || "");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ticketArgs = useMemo(() => {
    if (!id) return "skip" as const;
    if (user?.email) {
      return { ticket_id: id as Id<"support_tickets"> };
    }
    const guestEmail = emailInput.trim();
    if (!guestEmail) return "skip" as const;
    return {
      ticket_id: id as Id<"support_tickets">,
      guest_email: guestEmail,
    };
  }, [id, user?.email, emailInput]);

  const ticket = useQuery(api.support.getTicketForUser, ticketArgs);

  const resolvedEmail = user?.email || emailInput.trim();

  return (
    <div className="min-h-screen bg-[#F6F2EE] px-6 py-20">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Support</p>
            <h1 className="font-display text-2xl mt-1">Ticket Detail</h1>
          </div>
          <Link to="/support" className="text-xs uppercase tracking-widest underline">
            Back to support
          </Link>
        </div>

        {!user?.email ? (
          <form
            className="bg-white border border-[#111]/10 p-4 flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const email = emailInput.trim();
              if (!email) return;
              setSearchParams({ email });
            }}
          >
            <div className="flex-1 min-w-56">
              <label className="text-xs uppercase tracking-widest text-[#6E6E6E]">Email</label>
              <input
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                className="w-full border border-[#111]/10 px-3 py-2 mt-1"
                required
              />
            </div>
            <button className="btn-primary px-4 py-2">Load Ticket</button>
          </form>
        ) : null}

        {ticketArgs === "skip" ? (
          <div className="bg-white border border-[#111]/10 p-5 text-sm text-[#6E6E6E]">
            Enter your email to access this ticket.
          </div>
        ) : ticket === undefined ? (
          <div className="bg-white border border-[#111]/10 p-5 text-sm text-[#6E6E6E]">
            Loading ticket...
          </div>
        ) : ticket === null ? (
          <div className="bg-white border border-[#111]/10 p-5 text-sm text-red-600">
            Ticket not found or access denied.
          </div>
        ) : (
          <>
            <section className="bg-white border border-[#111]/10 p-5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-lg font-medium">{ticket.subject}</p>
                <span className="text-[10px] uppercase tracking-widest border border-[#111]/10 px-2 py-1">
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-[#6E6E6E]">
                Priority: {ticket.priority} - Created {new Date(ticket.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-[#6E6E6E]">
                Last update: {new Date(ticket.updated_at).toLocaleString()}
              </p>
            </section>

            <section className="bg-white border border-[#111]/10 p-5 space-y-3">
              <h2 className="font-display text-lg">Conversation</h2>
              {ticket.events.length === 0 ? (
                <p className="text-sm text-[#6E6E6E]">No messages yet.</p>
              ) : (
                <div className="space-y-2">
                  {ticket.events.map((event: any) => (
                    <article
                      key={event._id}
                      className={`border p-3 space-y-1 ${eventTone(event.type)}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-widest">{eventLabel(event.type)}</p>
                        <p className="text-xs text-[#6E6E6E]">
                          {new Date(event.created_at).toLocaleString()}
                        </p>
                      </div>
                      {event.note ? <p className="text-sm whitespace-pre-wrap">{event.note}</p> : null}
                      {event.payload?.status ? (
                        <p className="text-xs text-[#6E6E6E]">Status: {event.payload.status}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <form
              className="bg-white border border-[#111]/10 p-5 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const message = reply.trim();
                if (!message) {
                  setStatus("Reply cannot be empty.");
                  return;
                }
                if (!user?.email && !resolvedEmail) {
                  setStatus("Email is required to reply.");
                  return;
                }

                setSaving(true);
                setStatus(null);
                try {
                  await addReply({
                    ticket_id: ticket._id,
                    message,
                    guest_email: user?.email ? undefined : resolvedEmail,
                  });
                  setReply("");
                  setStatus("Reply sent.");
                } catch (error: any) {
                  setStatus(error?.message ?? "Unable to send reply.");
                } finally {
                  setSaving(false);
                }
              }}
            >
              <h2 className="font-display text-lg">Reply</h2>
              <textarea
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                className="w-full border border-[#111]/10 px-3 py-2 min-h-28"
                placeholder="Write your message to support..."
                required
              />
              {status ? <p className="text-xs text-[#6E6E6E]">{status}</p> : null}
              <button className="btn-primary" disabled={saving}>
                {saving ? "Sending..." : "Send Reply"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
