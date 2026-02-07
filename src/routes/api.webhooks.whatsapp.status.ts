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
    namespace: "webhook:whatsapp:status",
    max: 240,
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
    const secret = env.WHATSAPP_WEBHOOK_SECRET;
    const signature =
      request.headers.get("x-whatsapp-signature") ??
      request.headers.get("x-hub-signature-256") ??
      request.headers.get("x-signature");
    const { rawBody, payload: body } = await readWebhookPayload(request);
    const verification = await verifyWebhookSignature({
      rawBody,
      secret,
      signature,
    });
    if (secret && !verification.valid) {
      console.warn("whatsapp status webhook rejected", { reason: verification.reason });
      return json(
        { ok: false, error: "Invalid webhook signature" },
        { status: 401, headers: rateHeaders }
      );
    }

    const jobId = body.job_id;
    if (!jobId) {
      return json(
        { ok: false, error: "job_id is required" },
        { status: 400, headers: rateHeaders }
      );
    }

    const convex = createConvexClient(context);
    await convex.mutation(api.campaigns.updateJobStatus, {
      job_id: jobId,
      status: String(body.status ?? "delivered"),
      provider_message_id: body.provider_message_id
        ? String(body.provider_message_id)
        : undefined,
      provider_payload: body,
      event: String(body.event ?? "whatsapp_status"),
    });
    console.info("whatsapp status webhook processed", {
      job_id: jobId,
      status: String(body.status ?? "delivered"),
      signature_valid: verification.valid,
    });
    return json({
      ok: true,
      signature_valid: verification.valid,
      signature_reason: verification.reason,
    }, { headers: rateHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid webhook payload";
    return json({ ok: false, error: message }, { status: 400, headers: rateHeaders });
  }
};
