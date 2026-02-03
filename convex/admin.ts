import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const isAdmin = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    const email = user?.email;
    if (!email) return false;
    const admin = await ctx.db
      .query("admin_users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    return !!admin;
  },
});
