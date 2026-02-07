export async function recordAudit(
  ctx: any,
  args: {
    actor_user_id?: string;
    actor_email?: string;
    action: string;
    entity_type: string;
    entity_id?: string;
    before?: any;
    after?: any;
    meta?: any;
  }
) {
  await ctx.db.insert("audit_logs", {
    actor_user_id: args.actor_user_id as any,
    actor_email: args.actor_email,
    action: args.action,
    entity_type: args.entity_type,
    entity_id: args.entity_id,
    before: args.before,
    after: args.after,
    meta: args.meta,
    created_at: Date.now(),
  });
}
