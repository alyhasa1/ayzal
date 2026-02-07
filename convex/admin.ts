import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAdmin } from "./lib/auth";
import { v } from "convex/values";

export const isAdmin = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    const email = user?.email?.trim();
    if (!email) return false;
    let admin = await ctx.db
      .query("admin_users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!admin && email.toLowerCase() !== email) {
      admin = await ctx.db
        .query("admin_users")
        .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
        .unique();
    }
    return !!admin;
  },
});

export const repairAuthAccounts = mutation({
  args: {
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const accounts = args.email
      ? await ctx.db
          .query("authAccounts")
          .withIndex("providerAndAccountId", (q) =>
            q.eq("provider", "password").eq("providerAccountId", args.email!),
          )
          .collect()
      : await ctx.db.query("authAccounts").collect();

    let repaired = 0;
    for (const account of accounts) {
      const user = await ctx.db.get(account.userId);
      if (user) continue;
      const email = account.providerAccountId;
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        email,
        emailVerificationTime: now,
      });
      await ctx.db.patch(account._id, {
        userId,
        emailVerified: email,
      });
      repaired += 1;
    }
    return { repaired, total: accounts.length };
  },
});
