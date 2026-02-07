import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./lib/auth";
import { recordAudit } from "./lib/audit";

export const adminList = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "segments.read");
    const segments = await ctx.db.query("customer_segments").collect();
    const rows = [];
    for (const segment of segments.sort((a: any, b: any) => b.updated_at - a.updated_at)) {
      const members = await ctx.db
        .query("segment_memberships")
        .withIndex("by_segment", (q: any) => q.eq("segment_id", segment._id))
        .collect();
      rows.push({ ...segment, member_count: members.length });
    }
    return rows;
  },
});

export const adminCreate = mutation({
  args: {
    name: v.string(),
    key: v.optional(v.string()),
    rules: v.any(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "segments.write");
    const now = Date.now();
    const id = await ctx.db.insert("customer_segments", {
      name: args.name,
      key: args.key,
      rules: args.rules,
      active: args.active,
      created_at: now,
      updated_at: now,
    });
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "segment.created",
      entity_type: "customer_segment",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("customer_segments"),
    name: v.optional(v.string()),
    key: v.optional(v.string()),
    rules: v.optional(v.any()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "segments.write");
    const before = await ctx.db.get(args.id);
    if (!before) throw new Error("Segment not found");
    const update: any = { updated_at: Date.now() };
    if (args.name !== undefined) update.name = args.name;
    if (args.key !== undefined) update.key = args.key;
    if (args.rules !== undefined) update.rules = args.rules;
    if (args.active !== undefined) update.active = args.active;
    await ctx.db.patch(args.id, update);

    const after = await ctx.db.get(args.id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "segment.updated",
      entity_type: "customer_segment",
      entity_id: String(args.id),
      before,
      after,
    });
  },
});

export const assignUser = mutation({
  args: {
    segment_id: v.id("customer_segments"),
    user_id: v.optional(v.id("users")),
    guest_token: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "segments.write");
    if (!args.user_id && !args.guest_token) {
      throw new Error("user_id or guest_token is required");
    }

    const members = await ctx.db
      .query("segment_memberships")
      .withIndex("by_segment", (q: any) => q.eq("segment_id", args.segment_id))
      .collect();
    const existing = members.find(
      (member: any) =>
        (args.user_id && member.user_id === args.user_id) ||
        (args.guest_token && member.guest_token === args.guest_token)
    );
    if (existing) {
      await ctx.db.patch(existing._id, {
        source: args.source ?? existing.source,
        updated_at: Date.now(),
      });
      await recordAudit(ctx, {
        actor_user_id: userId,
        actor_email: email,
        action: "segment.membership.updated",
        entity_type: "segment_membership",
        entity_id: String(existing._id),
        before: existing,
        after: await ctx.db.get(existing._id),
      });
      return existing._id;
    }

    const id = await ctx.db.insert("segment_memberships", {
      segment_id: args.segment_id,
      user_id: args.user_id,
      guest_token: args.guest_token,
      source: args.source ?? "manual",
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "segment.membership.created",
      entity_type: "segment_membership",
      entity_id: String(id),
      after: args,
    });
    return id;
  },
});

export const removeMembership = mutation({
  args: {
    membership_id: v.id("segment_memberships"),
  },
  handler: async (ctx, args) => {
    const { userId, email } = await requirePermission(ctx, "segments.write");
    const before = await ctx.db.get(args.membership_id);
    if (!before) throw new Error("Membership not found");
    await ctx.db.delete(args.membership_id);
    await recordAudit(ctx, {
      actor_user_id: userId,
      actor_email: email,
      action: "segment.membership.removed",
      entity_type: "segment_membership",
      entity_id: String(args.membership_id),
      before,
    });
  },
});

export const listMemberships = query({
  args: {
    segment_id: v.optional(v.id("customer_segments")),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "segments.read");
    const rows = args.segment_id
      ? await ctx.db
          .query("segment_memberships")
          .withIndex("by_segment", (q: any) => q.eq("segment_id", args.segment_id))
          .collect()
      : await ctx.db.query("segment_memberships").collect();

    const segmentNameById = new Map(
      (await ctx.db.query("customer_segments").collect()).map((segment: any) => [
        String(segment._id),
        segment.name,
      ])
    );

    const hydrated = [];
    for (const row of rows.sort((a: any, b: any) => b.updated_at - a.updated_at)) {
      const user = row.user_id ? await ctx.db.get(row.user_id) : null;
      hydrated.push({
        ...row,
        segment_name: segmentNameById.get(String(row.segment_id)) ?? "",
        user_email: user?.email,
      });
    }
    return hydrated;
  },
});
