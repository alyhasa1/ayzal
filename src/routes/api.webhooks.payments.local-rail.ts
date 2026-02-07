import { json, type ActionFunctionArgs } from "@remix-run/cloudflare";
import { api } from "../../convex/_generated/api";
import { createConvexClient } from "@/lib/convex.server";
import {
  getServerEnv,
  readWebhookPayload,
  verifyWebhookSignature,
} from "@/lib/webhook.server";
import { buildRateLimitHeaders, checkRequestRateLimit } from "@/lib/rate-limit.server";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const rateLimit = checkRequestRateLimit({
    request,
    namespace: "webhook:payments:local-rail",
    max: 120,
    windowMs: 60_000,
    scope: "path-and-ip",
  });
  const rateHeaders = buildRateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    return json(
      { ok: false, error: "Rate limit exceeded. Please retry shortly." },
      { status: 429, headers: rateHeaders }
    );
  }

  try {
    const env = getServerEnv(context);
    const secret = env.LOCAL_RAIL_WEBHOOK_SECRET;
    const signature =
      request.headers.get("x-local-rail-signature") ?? request.headers.get("x-signature");
    const { rawBody, payload: body } = await readWebhookPayload(request);
    const verification = await verifyWebhookSignature({
      rawBody,
      secret,
      signature,
    });
    if (secret && !verification.valid) {
      console.warn("local-rail webhook rejected", {
        reason: verification.reason,
      });
      return json(
        { ok: false, error: "Invalid webhook signature" },
        { status: 401, headers: rateHeaders }
      );
    }

    const convex = createConvexClient(context);
    const result = await convex.mutation(api.payments.reconcileWebhook, {
      provider: "local-rail",
      event_id: String(body.event_id ?? body.id ?? ""),
      event_type: String(body.event_type ?? body.type ?? "unknown"),
      provider_intent_id: body.provider_intent_id ? String(body.provider_intent_id) : undefined,
      signature_valid: verification.valid,
      payload: body,
    });
    console.info("local-rail webhook processed", {
      event_id: String(body.event_id ?? body.id ?? ""),
      event_type: String(body.event_type ?? body.type ?? "unknown"),
      signature_valid: verification.valid,
    });
    return json({
      ok: true,
      result,
      signature_valid: verification.valid,
      signature_reason: verification.reason,
    }, { headers: rateHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid webhook payload";
    return json({ ok: false, error: message }, { status: 400, headers: rateHeaders });
  }
};
