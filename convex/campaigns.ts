import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePermission } from "./lib/auth";

export const adminList = query({
  handler: async (ctx) => {
    await requirePermission(ctx, "campaigns.read");
    const campaigns = await ctx.db.query("campaigns").collect();
    const rows = [];
    for (const campaign of campaigns.sort((a: any, b: any) => b.updated_at - a.updated_at)) {
      const runs = await ctx.db
        .query("campaign_runs")
        .withIndex("by_campaign", (q: any) => q.eq("campaign_id", campaign._id))
        .collect();
      rows.push({
        ...campaign,
        run_count: runs.length,
        last_run_at:
          runs.length > 0
            ? Math.max(...runs.map((run: any) => run.started_at ?? run.created_at))
            : null,
      });
    }
    return rows;
  },
});

export const adminCreate = mutation({
  args: {
    name: v.string(),
    channel: v.string(),
    status: v.string(),
    segment_id: v.optional(v.id("customer_segments")),
    template_id: v.optional(v.id("notification_templates")),
    schedule_at: v.optional(v.number()),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.write");
    const now = Date.now();
    return await ctx.db.insert("campaigns", {
      name: args.name,
      channel: args.channel,
      status: args.status,
      segment_id: args.segment_id,
      template_id: args.template_id,
      schedule_at: args.schedule_at,
      config: args.config ?? {},
      created_at: now,
      updated_at: now,
    });
  },
});

export const adminUpdate = mutation({
  args: {
    id: v.id("campaigns"),
    name: v.optional(v.string()),
    channel: v.optional(v.string()),
    status: v.optional(v.string()),
    segment_id: v.optional(v.id("customer_segments")),
    template_id: v.optional(v.id("notification_templates")),
    schedule_at: v.optional(v.number()),
    config: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.write");
    const patch: any = { updated_at: Date.now() };
    for (const key of [
      "name",
      "channel",
      "status",
      "segment_id",
      "template_id",
      "schedule_at",
      "config",
    ]) {
      const value = (args as any)[key];
      if (value !== undefined) patch[key] = value;
    }
    await ctx.db.patch(args.id, patch);
  },
});

export const createTemplate = mutation({
  args: {
    key: v.string(),
    channel: v.string(),
    name: v.string(),
    subject: v.optional(v.string()),
    body: v.string(),
    variables: v.optional(v.array(v.string())),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.write");
    const now = Date.now();
    return await ctx.db.insert("notification_templates", {
      key: args.key,
      channel: args.channel,
      name: args.name,
      subject: args.subject,
      body: args.body,
      variables: args.variables,
      active: args.active,
      created_at: now,
      updated_at: now,
    });
  },
});

export const listTemplates = query({
  args: {
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.read");
    const templates = args.channel
      ? (await ctx.db
          .query("notification_templates")
          .withIndex("by_channel", (q: any) => q.eq("channel", args.channel))
          .collect())
      : await ctx.db.query("notification_templates").collect();
    return templates.sort((a: any, b: any) => b.updated_at - a.updated_at);
  },
});

export const startRun = mutation({
  args: {
    campaign_id: v.id("campaigns"),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.write");
    const campaign = await ctx.db.get(args.campaign_id);
    if (!campaign) throw new Error("Campaign not found");

    const now = Date.now();
    const runId = await ctx.db.insert("campaign_runs", {
      campaign_id: campaign._id,
      status: "running",
      started_at: now,
      finished_at: undefined,
      recipient_count: 0,
      success_count: 0,
      failure_count: 0,
      created_at: now,
      updated_at: now,
    });

    const recipients: Array<{ user_id?: string; guest_contact?: string }> = [];
    if (campaign.segment_id) {
      const memberships = await ctx.db
        .query("segment_memberships")
        .withIndex("by_segment", (q: any) => q.eq("segment_id", campaign.segment_id))
        .collect();
      for (const member of memberships) {
        if (member.user_id) {
          recipients.push({ user_id: member.user_id });
        } else if (member.guest_token) {
          recipients.push({ guest_contact: member.guest_token });
        }
      }
    } else {
      const users = await ctx.db.query("users").collect();
      for (const user of users) {
        recipients.push({ user_id: user._id });
      }
    }

    const deduped = new Map<string, { user_id?: string; guest_contact?: string }>();
    for (const recipient of recipients) {
      const key = recipient.user_id ?? `guest:${recipient.guest_contact}`;
      if (!key) continue;
      deduped.set(key, recipient);
    }

    for (const recipient of deduped.values()) {
      let guestContact = recipient.guest_contact;
      if (recipient.user_id) {
        const user = await ctx.db.get(recipient.user_id as any);
        if (!user) continue;

        const preferences = await ctx.db
          .query("notification_preferences")
          .withIndex("by_user", (q: any) => q.eq("user_id", recipient.user_id))
          .unique();
        if (preferences) {
          const optedIn =
            campaign.channel === "whatsapp"
              ? preferences.whatsapp_marketing
              : preferences.email_marketing;
          if (!optedIn) continue;
        }

        if (campaign.channel === "whatsapp") {
          const profile = await ctx.db
            .query("user_profiles")
            .withIndex("by_user", (q: any) => q.eq("user_id", recipient.user_id))
            .unique();
          guestContact = profile?.phone ?? user.email;
        } else {
          guestContact = user.email;
        }
      }

      if (!guestContact) continue;

      await ctx.db.insert("notification_jobs", {
        template_id: campaign.template_id,
        campaign_run_id: runId,
        user_id: recipient.user_id as any,
        guest_contact: guestContact,
        channel: campaign.channel,
        status: "queued",
        payload: {
          campaign_id: campaign._id,
          config: campaign.config,
        },
        provider_message_id: undefined,
        retries: 0,
        next_attempt_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    await ctx.db.patch(runId, {
      recipient_count: deduped.size,
      updated_at: Date.now(),
    });
    await ctx.db.patch(campaign._id, {
      status: "running",
      updated_at: Date.now(),
    });
    return runId;
  },
});

export const completeRun = mutation({
  args: {
    run_id: v.id("campaign_runs"),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.write");
    const run = await ctx.db.get(args.run_id);
    if (!run) throw new Error("Run not found");

    const jobs = await ctx.db
      .query("notification_jobs")
      .withIndex("by_campaign_run", (q: any) => q.eq("campaign_run_id", args.run_id))
      .collect();
    const successCount = jobs.filter((job: any) => job.status === "sent").length;
    const failureCount = jobs.filter((job: any) => job.status === "failed").length;
    const now = Date.now();

    await ctx.db.patch(args.run_id, {
      status: "completed",
      finished_at: now,
      success_count: successCount,
      failure_count: failureCount,
      updated_at: now,
    });

    await ctx.db.patch(run.campaign_id, {
      status: "active",
      updated_at: now,
    });
  },
});

export const updateJobStatus = mutation({
  args: {
    job_id: v.id("notification_jobs"),
    status: v.string(),
    provider_message_id: v.optional(v.string()),
    provider_payload: v.optional(v.any()),
    event: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const job = await ctx.db.get(args.job_id);
    if (!job) throw new Error("Notification job not found");

    await ctx.db.patch(args.job_id, {
      status: args.status,
      provider_message_id: args.provider_message_id ?? job.provider_message_id,
      updated_at: now,
    });

    await ctx.db.insert("notification_logs", {
      job_id: args.job_id,
      template_id: job.template_id,
      channel: job.channel,
      event: args.event ?? args.status,
      provider_payload: args.provider_payload,
      created_at: now,
    });
  },
});

export const listRuns = query({
  args: {
    campaign_id: v.optional(v.id("campaigns")),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.read");
    const runs = args.campaign_id
      ? await ctx.db
          .query("campaign_runs")
          .withIndex("by_campaign", (q: any) => q.eq("campaign_id", args.campaign_id))
          .collect()
      : await ctx.db.query("campaign_runs").collect();

    const campaigns = await ctx.db.query("campaigns").collect();
    const campaignNameById = new Map(
      campaigns.map((campaign: any) => [String(campaign._id), campaign.name])
    );

    return runs
      .map((run: any) => ({
        ...run,
        campaign_name: campaignNameById.get(String(run.campaign_id)) ?? "",
      }))
      .sort((a: any, b: any) => (b.started_at ?? b.created_at) - (a.started_at ?? a.created_at));
  },
});

export const listJobs = query({
  args: {
    run_id: v.optional(v.id("campaign_runs")),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "campaigns.read");
    const limit = Math.min(400, Math.max(1, args.limit ?? 120));
    const jobs = args.run_id
      ? await ctx.db
          .query("notification_jobs")
          .withIndex("by_campaign_run", (q: any) => q.eq("campaign_run_id", args.run_id))
          .collect()
      : await ctx.db.query("notification_jobs").collect();

    const filtered = args.status
      ? jobs.filter((job: any) => job.status === args.status)
      : jobs;
    return filtered
      .sort((a: any, b: any) => b.updated_at - a.updated_at)
      .slice(0, limit);
  },
});
