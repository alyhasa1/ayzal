import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/components/admin/Toast";
import { fieldInputClass, fieldSelectClass } from "@/components/admin/FormField";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_customer", label: "Waiting Customer" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

function formatTimestamp(value?: number | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminSupport() {
  const { toast } = useToast();
  const users = useQuery(api.rbac.adminListUsers) ?? [];
  const summary = useQuery(api.support.adminQueueSummary);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [search, setSearch] = useState("");

  const ticketsQuery =
    useQuery(api.support.adminList, {
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      assigned_to: assignedFilter ? (assignedFilter as any) : undefined,
      overdue_only: overdueOnly || undefined,
      search: search.trim() || undefined,
      limit: 200,
    });
  const tickets = ticketsQuery ?? [];

  const [selectedTicketId, setSelectedTicketId] = useState("");
  const selectedTicket = useMemo(
    () => (ticketsQuery ?? []).find((ticket: any) => String(ticket._id) === selectedTicketId) ?? null,
    [ticketsQuery, selectedTicketId]
  );

  const updateTicket = useMutation(api.support.adminUpdate);
  const addNote = useMutation(api.support.adminAddNote);

  const [ticketStatus, setTicketStatus] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");
  const [ticketAssignee, setTicketAssignee] = useState("");
  const [ticketDueAt, setTicketDueAt] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteVisibility, setNoteVisibility] = useState("internal");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadTicket = (ticket: any) => {
    setSelectedTicketId(String(ticket._id));
    setTicketStatus(ticket.status ?? "");
    setTicketPriority(ticket.priority ?? "");
    setTicketAssignee(ticket.assigned_to ? String(ticket.assigned_to) : "");
    setTicketDueAt(ticket.sla_due_at ? new Date(ticket.sla_due_at).toISOString().slice(0, 16) : "");
    setNoteDraft("");
    setNoteVisibility("internal");
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 xl:grid-cols-6 gap-3">
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Total</p>
          <p className="font-display text-xl">{summary?.total ?? "-"}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Unresolved</p>
          <p className="font-display text-xl">{summary?.unresolved ?? "-"}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Overdue SLA</p>
          <p className="font-display text-xl">{summary?.overdue ?? "-"}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Unassigned</p>
          <p className="font-display text-xl">{summary?.unassigned ?? "-"}</p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Median First Response</p>
          <p className="font-display text-xl">
            {summary?.first_response_median_minutes !== null &&
            summary?.first_response_median_minutes !== undefined
              ? `${summary.first_response_median_minutes}m`
              : "-"}
          </p>
        </div>
        <div className="bg-white border border-[#111]/10 p-3">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Showing</p>
          <p className="font-display text-xl">{tickets.length}</p>
        </div>
      </section>

      <section className="bg-white border border-[#111]/10 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <input
            className={fieldInputClass}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subject, email, phone, order"
          />
          <select
            className={fieldSelectClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={fieldSelectClass}
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={fieldSelectClass}
            value={assignedFilter}
            onChange={(event) => setAssignedFilter(event.target.value)}
          >
            <option value="">All assignees</option>
            {users.map((user: any) => (
              <option key={user._id} value={user._id}>
                {user.email}
              </option>
            ))}
          </select>
          <label className="text-xs uppercase tracking-widest flex items-center gap-2 px-3 border border-[#111]/10">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(event) => setOverdueOnly(event.target.checked)}
            />
            Overdue only
          </label>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-5">
          <div className="space-y-2">
            {tickets.length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No tickets match this filter.</p>
            ) : (
              tickets.map((ticket: any) => (
                <article
                  key={ticket._id}
                  className={`border p-3 cursor-pointer transition-colors ${
                    selectedTicketId === String(ticket._id)
                      ? "border-[#D4A05A]"
                      : "border-[#111]/10 hover:border-[#111]/20"
                  }`}
                  onClick={() => loadTicket(ticket)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{ticket.subject}</p>
                      <p className="text-xs text-[#6E6E6E]">
                        {ticket.user_email || ticket.guest_email || "unknown customer"}
                      </p>
                      <p className="text-xs text-[#6E6E6E]">
                        {ticket.assignee_email || "unassigned"}
                        {ticket.order_number ? ` - ${ticket.order_number}` : ""}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="uppercase tracking-widest">{ticket.status}</p>
                      <p className="text-[#6E6E6E]">{ticket.priority}</p>
                      {ticket.sla_overdue ? (
                        <p className="text-red-600 uppercase tracking-widest">SLA overdue</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-[#6E6E6E]">
                    Created {formatTimestamp(ticket.created_at)} - Updated {formatTimestamp(ticket.updated_at)}
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="border border-[#111]/10 p-4 space-y-4 bg-[#111]/[0.01]">
            {!selectedTicket ? (
              <p className="text-sm text-[#6E6E6E]">Select a ticket to manage it.</p>
            ) : (
              <>
                <div>
                  <h3 className="font-display text-lg">{selectedTicket.subject}</h3>
                  <p className="text-xs text-[#6E6E6E]">
                    {selectedTicket.user_email || selectedTicket.guest_email || "unknown customer"}
                    {selectedTicket.guest_phone ? ` - ${selectedTicket.guest_phone}` : ""}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    className={fieldSelectClass}
                    value={ticketStatus}
                    onChange={(event) => setTicketStatus(event.target.value)}
                  >
                    {STATUS_OPTIONS.filter((option) => option.value).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={fieldSelectClass}
                    value={ticketPriority}
                    onChange={(event) => setTicketPriority(event.target.value)}
                  >
                    {PRIORITY_OPTIONS.filter((option) => option.value).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={fieldSelectClass}
                    value={ticketAssignee}
                    onChange={(event) => setTicketAssignee(event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map((user: any) => (
                      <option key={user._id} value={user._id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    className={fieldInputClass}
                    value={ticketDueAt}
                    onChange={(event) => setTicketDueAt(event.target.value)}
                  />
                </div>

                <button
                  className="btn-primary"
                  disabled={busyKey === "save-ticket"}
                  onClick={async () => {
                    setBusyKey("save-ticket");
                    try {
                      await updateTicket({
                        id: selectedTicket._id,
                        status: ticketStatus || undefined,
                        priority: ticketPriority || undefined,
                        assigned_to: ticketAssignee ? (ticketAssignee as any) : null,
                        sla_due_at: ticketDueAt
                          ? new Date(ticketDueAt).getTime()
                          : undefined,
                      });
                      toast("Ticket updated");
                    } catch (error: any) {
                      toast(error?.message ?? "Unable to update ticket", "error");
                    } finally {
                      setBusyKey(null);
                    }
                  }}
                >
                  {busyKey === "save-ticket" ? "Saving..." : "Save Ticket"}
                </button>

                <div className="space-y-2 border-t border-[#111]/10 pt-3">
                  <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Add Note</p>
                  <textarea
                    className={`${fieldInputClass} min-h-20`}
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Write internal context or customer-visible message..."
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className={fieldSelectClass}
                      value={noteVisibility}
                      onChange={(event) => setNoteVisibility(event.target.value)}
                    >
                      <option value="internal">Internal note</option>
                      <option value="customer">Customer note</option>
                    </select>
                    <button
                      className="border border-[#111]/10 px-3 py-2 text-xs uppercase tracking-widest"
                      disabled={busyKey === "add-note"}
                      onClick={async () => {
                        if (!noteDraft.trim()) {
                          toast("Note is required", "error");
                          return;
                        }
                        setBusyKey("add-note");
                        try {
                          await addNote({
                            id: selectedTicket._id,
                            note: noteDraft.trim(),
                            visibility: noteVisibility,
                          });
                          setNoteDraft("");
                          toast("Note added");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to add note", "error");
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                    >
                      {busyKey === "add-note" ? "Saving..." : "Add Note"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-[#111]/10 pt-3">
                  <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Timeline</p>
                  {selectedTicket.events.length === 0 ? (
                    <p className="text-sm text-[#6E6E6E]">No events yet.</p>
                  ) : (
                    selectedTicket.events
                      .slice()
                      .reverse()
                      .map((event: any) => (
                        <div key={event._id} className="border border-[#111]/10 p-2 text-xs">
                          <p className="font-medium">{event.type}</p>
                          <p className="text-[#6E6E6E]">{formatTimestamp(event.created_at)}</p>
                          {event.note ? <p className="mt-1">{event.note}</p> : null}
                        </div>
                      ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
