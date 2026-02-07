import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import FormField, { fieldInputClass, fieldSelectClass } from "@/components/admin/FormField";
import { useToast } from "@/components/admin/Toast";

const suggestedPermissions = [
  "orders.read",
  "orders.update",
  "products.read",
  "products.write",
  "inventory.read",
  "inventory.write",
  "shipping.read",
  "shipping.write",
  "promotions.read",
  "promotions.write",
  "returns.read",
  "returns.write",
  "campaigns.read",
  "campaigns.write",
  "analytics.read",
  "rbac.manage",
  "audit.read",
];

export default function AdminTeam() {
  const roles = useQuery(api.rbac.adminListRoles) ?? [];
  const users = useQuery(api.rbac.adminListUsers) ?? [];
  const assignmentsQuery = useQuery(api.rbac.adminListAssignments);
  const assignments = assignmentsQuery ?? [];
  const createRole = useMutation(api.rbac.adminCreateRole);
  const assignRole = useMutation(api.rbac.adminAssignRole);
  const removeAssignment = useMutation(api.rbac.adminRemoveAssignment);
  const { toast } = useToast();

  const [roleKey, setRoleKey] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [assigning, setAssigning] = useState(false);

  const assignedRoleIds = useMemo(
    () => new Set((assignmentsQuery ?? []).map((item: any) => String(item.role_id))),
    [assignmentsQuery]
  );

  const handleCreateRole = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!roleKey.trim() || !roleName.trim()) {
      toast("Role key and name are required", "error");
      return;
    }
    const permissions = rolePermissions
      .split(/[\n,]+/)
      .map((permission) => permission.trim())
      .filter(Boolean);
    if (permissions.length === 0) {
      toast("Add at least one permission", "error");
      return;
    }

    setCreatingRole(true);
    try {
      await createRole({
        key: roleKey.trim().toLowerCase(),
        name: roleName.trim(),
        description: roleDescription.trim() || undefined,
        permissions,
      });
      setRoleKey("");
      setRoleName("");
      setRoleDescription("");
      setRolePermissions("");
      toast("Role created");
    } catch (error: any) {
      toast(error?.message ?? "Unable to create role", "error");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleAssign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedRoleId) {
      toast("Select a role", "error");
      return;
    }
    if (!selectedUserId && !targetEmail.trim()) {
      toast("Select a user or enter an email", "error");
      return;
    }

    setAssigning(true);
    try {
      await assignRole({
        role_id: selectedRoleId as any,
        user_id: selectedUserId ? (selectedUserId as any) : undefined,
        email: selectedUserId ? undefined : targetEmail.trim().toLowerCase(),
      });
      setSelectedUserId("");
      setTargetEmail("");
      toast("Role assigned");
    } catch (error: any) {
      toast(error?.message ?? "Unable to assign role", "error");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form className="bg-white border border-[#111]/10 p-6 space-y-3" onSubmit={handleCreateRole}>
          <h2 className="font-display text-xl">Create Role</h2>
          <FormField label="Role Key" hint="Lowercase identifier" required>
            <input
              className={fieldInputClass}
              value={roleKey}
              onChange={(event) => setRoleKey(event.target.value)}
              placeholder="ops_manager"
              required
            />
          </FormField>
          <FormField label="Role Name" required>
            <input
              className={fieldInputClass}
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              placeholder="Operations Manager"
              required
            />
          </FormField>
          <FormField label="Description">
            <input
              className={fieldInputClass}
              value={roleDescription}
              onChange={(event) => setRoleDescription(event.target.value)}
              placeholder="Can manage orders, shipping and returns"
            />
          </FormField>
          <FormField
            label="Permissions"
            hint="Use comma or new line separated values"
            required
          >
            <textarea
              className={`${fieldInputClass} min-h-24`}
              value={rolePermissions}
              onChange={(event) => setRolePermissions(event.target.value)}
              required
            />
          </FormField>
          <button className="btn-primary w-full" type="submit" disabled={creatingRole}>
            {creatingRole ? "Creating..." : "Create Role"}
          </button>
        </form>

        <form className="bg-white border border-[#111]/10 p-6 space-y-3" onSubmit={handleAssign}>
          <h2 className="font-display text-xl">Assign Role</h2>
          <FormField label="Role" required>
            <select
              className={fieldSelectClass}
              value={selectedRoleId}
              onChange={(event) => setSelectedRoleId(event.target.value)}
              required
            >
              <option value="">Select role</option>
              {roles.map((role: any) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Existing User">
            <select
              className={fieldSelectClass}
              value={selectedUserId}
              onChange={(event) => {
                setSelectedUserId(event.target.value);
                if (event.target.value) setTargetEmail("");
              }}
            >
              <option value="">Select user (optional)</option>
              {users.map((user: any) => (
                <option key={user._id} value={user._id}>
                  {user.email}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Or Invite by Email" hint="Use when user has no account yet">
            <input
              className={fieldInputClass}
              type="email"
              value={targetEmail}
              onChange={(event) => {
                setTargetEmail(event.target.value);
                if (event.target.value) setSelectedUserId("");
              }}
              placeholder="ops@yourstore.com"
            />
          </FormField>
          <button className="btn-primary w-full" type="submit" disabled={assigning}>
            {assigning ? "Assigning..." : "Assign Role"}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#111]/10 p-6 space-y-4">
          <h2 className="font-display text-lg">Roles</h2>
          {roles.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No roles defined.</p>
          ) : (
            roles.map((role: any) => (
              <article key={role._id} className="border border-[#111]/10 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{role.name}</p>
                    <p className="text-xs text-[#6E6E6E]">Key: {role.key}</p>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
                      assignedRoleIds.has(String(role._id))
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-[#111]/10 text-[#6E6E6E]"
                    }`}
                  >
                    {assignedRoleIds.has(String(role._id)) ? "In Use" : "Unused"}
                  </span>
                </div>
                {role.description ? (
                  <p className="text-sm text-[#6E6E6E]">{role.description}</p>
                ) : null}
                <div className="flex flex-wrap gap-1">
                  {(role.permissions ?? []).map((permission: string) => (
                    <span
                      key={permission}
                      className="text-[10px] uppercase tracking-widest px-2 py-1 border border-[#111]/10 bg-[#111]/5"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </section>

        <section className="bg-white border border-[#111]/10 p-6 space-y-4">
          <h2 className="font-display text-lg">Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-[#6E6E6E]">No assignments created.</p>
          ) : (
            assignments.map((assignment: any) => (
              <article key={assignment._id} className="border border-[#111]/10 p-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{assignment.assigned_to}</p>
                    <p className="text-xs text-[#6E6E6E]">
                      {assignment.role?.name ?? "Unknown role"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs border border-red-200 text-red-500 px-2 py-1"
                    onClick={async () => {
                      try {
                        await removeAssignment({ assignment_id: assignment._id });
                        toast("Assignment removed");
                      } catch (error: any) {
                        toast(error?.message ?? "Unable to remove assignment", "error");
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-[#6E6E6E]">
                  Added {new Date(assignment.created_at).toLocaleString()}
                  {assignment.created_by_email
                    ? ` by ${assignment.created_by_email}`
                    : ""}
                </p>
              </article>
            ))
          )}
        </section>
      </div>

      <section className="bg-white border border-[#111]/10 p-6 space-y-3">
        <h2 className="font-display text-lg">Permission Suggestions</h2>
        <p className="text-sm text-[#6E6E6E]">
          Suggested permission keys for your rollout. You can copy these into new roles.
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedPermissions.map((permission) => (
            <code
              key={permission}
              className="text-xs border border-[#111]/10 bg-[#111]/5 px-2 py-1"
            >
              {permission}
            </code>
          ))}
        </div>
      </section>
    </div>
  );
}
