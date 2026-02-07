import { getAuthUserId } from "@convex-dev/auth/server";

export async function requireUser(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function requireAdmin(ctx: any) {
  const userId = await requireUser(ctx);
  const user = await ctx.db.get(userId);
  const email = user?.email?.trim();
  if (!email) {
    throw new Error("Unauthorized");
  }
  let admin = await ctx.db
    .query("admin_users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();
  if (!admin && email.toLowerCase() !== email) {
    admin = await ctx.db
      .query("admin_users")
      .withIndex("by_email", (q: any) => q.eq("email", email.toLowerCase()))
      .unique();
  }
  if (!admin) {
    throw new Error("Forbidden");
  }
  return {
    userId,
    email: email.toLowerCase(),
    adminRole: (admin.role ?? "admin").toLowerCase(),
  };
}

async function getRolePermissions(ctx: any, userId: string, email?: string) {
  const normalizedEmail = email?.toLowerCase();
  const assignmentsByUser = await ctx.db
    .query("admin_role_assignments")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .collect();
  const assignmentsByEmail = normalizedEmail
    ? await ctx.db
        .query("admin_role_assignments")
        .withIndex("by_email", (q: any) => q.eq("email", normalizedEmail))
        .collect()
    : [];

  const uniqueRoleIds = new Set<any>();
  for (const assignment of [...assignmentsByUser, ...assignmentsByEmail]) {
    uniqueRoleIds.add(assignment.role_id);
  }

  const permissions = new Set<string>();
  for (const roleId of uniqueRoleIds) {
    const role = await ctx.db.get(roleId);
    for (const permission of role?.permissions ?? []) {
      permissions.add(permission);
    }
  }
  return permissions;
}

function hasPermission(permissions: Set<string>, required: string) {
  if (permissions.has("*") || permissions.has("admin.*") || permissions.has(required)) {
    return true;
  }
  const [prefix] = required.split(".");
  if (prefix && permissions.has(`${prefix}.*`)) {
    return true;
  }
  return false;
}

export async function requirePermission(ctx: any, permission: string) {
  const admin = await requireAdmin(ctx);
  if (admin.adminRole === "admin" || admin.adminRole === "super_admin" || admin.adminRole === "owner") {
    return admin;
  }
  const permissions = await getRolePermissions(ctx, admin.userId, admin.email);

  // Backward compatibility: if no RBAC roles are assigned yet, keep admin access.
  if (permissions.size === 0) {
    return admin;
  }
  if (hasPermission(permissions, permission)) {
    return admin;
  }
  throw new Error("Forbidden");
}
