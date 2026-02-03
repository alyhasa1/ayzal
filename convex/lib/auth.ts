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
  const email = user?.email;
  if (!email) {
    throw new Error("Unauthorized");
  }
  const admin = await ctx.db
    .query("admin_users")
    .withIndex("by_email", (q: any) => q.eq("email", email))
    .unique();
  if (!admin) {
    throw new Error("Forbidden");
  }
  return { userId, email };
}
