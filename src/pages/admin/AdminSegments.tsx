import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormField, { fieldInputClass } from "@/components/admin/FormField";
import { useToast } from "@/components/admin/Toast";

export default function AdminSegments() {
  const segmentsQuery = useQuery(api.segments.adminList);
  const users = useQuery(api.rbac.adminListUsers) ?? [];
  const createSegment = useMutation(api.segments.adminCreate);
  const updateSegment = useMutation(api.segments.adminUpdate);
  const assignUser = useMutation(api.segments.assignUser);
  const removeMembership = useMutation(api.segments.removeMembership);
  const { toast } = useToast();

  const [selectedSegmentId, setSelectedSegmentId] = useState("");
  const memberships = useQuery(
    api.segments.listMemberships,
    selectedSegmentId ? { segment_id: selectedSegmentId as any } : {}
  ) ?? [];

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [rules, setRules] = useState("{}");
  const [active, setActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const [assignUserId, setAssignUserId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const sortedSegments = useMemo(
    () => [...(segmentsQuery ?? [])].sort((a: any, b: any) => b.updated_at - a.updated_at),
    [segmentsQuery]
  );

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast("Segment name is required", "error");
      return;
    }
    let parsedRules: Record<string, unknown> = {};
    try {
      parsedRules = rules.trim() ? JSON.parse(rules) : {};
    } catch {
      toast("Rules must be valid JSON", "error");
      return;
    }
    setCreating(true);
    try {
      const id = await createSegment({
        name: name.trim(),
        key: key.trim() || undefined,
        rules: parsedRules,
        active,
      });
      if (!selectedSegmentId) setSelectedSegmentId(String(id));
      setName("");
      setKey("");
      setRules("{}");
      setActive(true);
      toast("Segment created");
    } catch (error: any) {
      toast(error?.message ?? "Unable to create segment", "error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <div className="space-y-6">
        <form className="bg-white border border-[#111]/10 p-6 space-y-3" onSubmit={create}>
          <h2 className="font-display text-xl">Create Segment</h2>
          <FormField label="Name" required>
            <input
              className={fieldInputClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </FormField>
          <FormField label="Key">
            <input
              className={fieldInputClass}
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="high_value, at_risk, repeat_buyers"
            />
          </FormField>
          <FormField label="Rules (JSON)">
            <textarea
              className={`${fieldInputClass} min-h-24`}
              value={rules}
              onChange={(event) => setRules(event.target.value)}
            />
          </FormField>
          <label className="text-xs uppercase tracking-widest flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Active
          </label>
          <button className="btn-primary w-full" type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Segment"}
          </button>
        </form>

        <section className="bg-white border border-[#111]/10 p-6 space-y-3">
          <h2 className="font-display text-lg">Segments</h2>
          {sortedSegments.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No segments created.</p>
          ) : (
            sortedSegments.map((segment: any) => (
              <article
                key={segment._id}
                className={`border p-3 space-y-2 ${
                  selectedSegmentId === segment._id
                    ? "border-[#D4A05A]"
                    : "border-[#111]/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    className="text-left"
                    onClick={() => setSelectedSegmentId(segment._id)}
                  >
                    <p className="text-sm font-medium">{segment.name}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {segment.key || "no-key"} • {segment.member_count} members
                    </p>
                  </button>
                  <button
                    className={`text-xs border px-2 py-1 ${
                      segment.active
                        ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                        : "border-[#111]/10 text-[#6E6E6E]"
                    }`}
                    onClick={async () => {
                      try {
                        await updateSegment({
                          id: segment._id,
                          active: !segment.active,
                        });
                        toast(segment.active ? "Segment disabled" : "Segment enabled");
                      } catch (error: any) {
                        toast(error?.message ?? "Unable to update segment", "error");
                      }
                    }}
                  >
                    {segment.active ? "Active" : "Inactive"}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      <div className="bg-white border border-[#111]/10 p-6 space-y-4">
        <h2 className="font-display text-xl">Memberships</h2>
        {!selectedSegmentId ? (
          <p className="text-sm text-[#6E6E6E]">Select a segment to manage memberships.</p>
        ) : (
          <>
            <form
              className="flex gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!assignUserId) {
                  toast("Select a user", "error");
                  return;
                }
                setAssigning(true);
                try {
                  await assignUser({
                    segment_id: selectedSegmentId as any,
                    user_id: assignUserId as any,
                    source: "manual_admin",
                  });
                  setAssignUserId("");
                  toast("User assigned to segment");
                } catch (error: any) {
                  toast(error?.message ?? "Unable to assign user", "error");
                } finally {
                  setAssigning(false);
                }
              }}
            >
              <select
                className="flex-1 border border-[#111]/10 px-3 py-2 text-sm bg-white"
                value={assignUserId}
                onChange={(event) => setAssignUserId(event.target.value)}
              >
                <option value="">Select user</option>
                {users.map((user: any) => (
                  <option key={user._id} value={user._id}>
                    {user.email}
                  </option>
                ))}
              </select>
              <button className="btn-primary px-4 py-2 text-xs" disabled={assigning}>
                {assigning ? "Assigning..." : "Assign"}
              </button>
            </form>

            {memberships.length === 0 ? (
              <p className="text-sm text-[#6E6E6E]">No members assigned.</p>
            ) : (
              <div className="space-y-2">
                {memberships.map((membership: any) => (
                  <div
                    key={membership._id}
                    className="border border-[#111]/10 p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {membership.user_email || membership.guest_token || "Unknown"}
                      </p>
                      <p className="text-xs text-[#6E6E6E]">
                        Source: {membership.source || "manual"}
                      </p>
                    </div>
                    <button
                      className="text-xs border border-red-200 text-red-500 px-2 py-1"
                      onClick={async () => {
                        try {
                          await removeMembership({
                            membership_id: membership._id,
                          });
                          toast("Membership removed");
                        } catch (error: any) {
                          toast(error?.message ?? "Unable to remove membership", "error");
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
