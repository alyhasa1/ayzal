import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requirePermission } from "./lib/auth";
import { recordAudit } from "./lib/audit";

async function getUserRoles(ctx: any, userId: string, email?: string) {
  const byUser = await ctx.db
    .query("admin_role_assignments")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .collect();
  let byEmail: any[] = [];
  if (email) {
    byEmail = await ctx.db
      .query("admin_role_assignments")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .collect();
  }
  const assignments = [...byUser, ...byEmail];
  const roles = [];
  for (const assignment of assignments) {
    const role = await ctx.db.get(assignment.role_id);
    if (role) roles.push(role);
  }
  return roles;
}

export const myPermissions = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    const roles = await getUserRoles(ctx, userId, user?.email);
    const permissions = new Set<string>();
    for (const role of roles) {
      for (const permission of role.permissions ?? []) permissions.add(permission);
    }
    return [...permissions];
  },
});

export const hasPermission = query({
  args: {
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    const roles = await getUserRoles(ctx, userId, user?.email);
    return roles.some((role: any) => (role.permissions ?? []).includes(args.permission));
  },
});

export const adminListRoles = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "rbac.manage");
    const roles = await ctx.db.query("admin_roles").collect();
    return roles.sort((a: any, b: any) => a.name.localeCompare(b.name));
  },
});

export const adminListUsers = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "rbac.manage");
    const users = await ctx.db.query("users").collect();
    return users
      .filter((user: any) => !!user.email)
      .map((user: any) => ({
        _id: user._id,
        email: user.email,
      }))
      .sort((a: any, b: any) => a.email.localeCompare(b.email));
  },
});

export const adminListAssignments = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "rbac.manage");
    const assignments = await ctx.db.query("admin_role_assignments").collect();
    const rows = [];
    for (const assignment of assignments) {
      const role = await ctx.db.get(assignment.role_id);
      const user = assignment.user_id ? await ctx.db.get(assignment.user_id) : null;
      const createdBy = assignment.created_by ? await ctx.db.get(assignment.created_by) : null;
      rows.push({
        ...assignment,
        role,
        user_email: user?.email,
        assigned_to: assignment.email ?? user?.email ?? "Unknown",
        created_by_email: createdBy?.email,
      });
    }
    return rows.sort((a: any, b: any) => b.created_at - a.created_at);
  },
});

export const adminCreateRole = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "rbac.manage");
    const now = Date.now();
    const id = await ctx.db.insert("admin_roles", {
      key: args.key,
      name: args.name,
      description: args.description,
      permissions: args.permissions,
      created_at: now,
      updated_at: now,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "rbac.role.created",
      entity_type: "admin_role",
      entity_id: String(id),
      after: args,
    });

    return id;
  },
});

export const adminAssignRole = mutation({
  args: {
    role_id: v.id("admin_roles"),
    user_id: v.optional(v.id("users")),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "rbac.manage");
    if (!args.user_id && !args.email) throw new Error("user_id or email is required");

    const targetEmail = args.email?.trim().toLowerCase();
    if (targetEmail && !targetEmail.includes("@")) {
      throw new Error("Enter a valid email");
    }

    const existingAssignments = await ctx.db
      .query("admin_role_assignments")
      .withIndex("by_role", (q: any) => q.eq("role_id", args.role_id))
      .collect();
    const duplicate = existingAssignments.find(
      (assignment: any) =>
        (args.user_id && assignment.user_id === args.user_id) ||
        (targetEmail && assignment.email === targetEmail)
    );
    if (duplicate) {
      throw new Error("Role is already assigned to this target");
    }

    const id = await ctx.db.insert("admin_role_assignments", {
      role_id: args.role_id,
      user_id: args.user_id,
      email: targetEmail,
      created_at: Date.now(),
      created_by: userId,
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "rbac.assignment.created",
      entity_type: "admin_role_assignment",
      entity_id: String(id),
      after: {
        role_id: args.role_id,
        user_id: args.user_id,
        email: targetEmail,
      },
    });

    return id;
  },
});

export const adminRemoveAssignment = mutation({
  args: {
    assignment_id: v.id("admin_role_assignments"),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "rbac.manage");
    const existing = await ctx.db.get(args.assignment_id);
    if (!existing) throw new Error("Assignment not found");
    await ctx.db.delete(args.assignment_id);

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "rbac.assignment.removed",
      entity_type: "admin_role_assignment",
      entity_id: String(args.assignment_id),
      before: existing,
    });
  },
});
