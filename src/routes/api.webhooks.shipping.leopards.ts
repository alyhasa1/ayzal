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
    namespace: "webhook:shipping:leopards",
    max: 180,
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
    const secret = env.SHIPPING_LEOPARDS_WEBHOOK_SECRET;
    const signature =
      request.headers.get("x-leopards-signature") ?? request.headers.get("x-signature");
    const { rawBody, payload: body } = await readWebhookPayload(request);
    const verification = await verifyWebhookSignature({
      rawBody,
      secret,
      signature,
    });
    if (secret && !verification.valid) {
      console.warn("leopards webhook rejected", { reason: verification.reason });
      return json(
        { ok: false, error: "Invalid webhook signature" },
        { status: 401, headers: rateHeaders }
      );
    }

    const convex = createConvexClient(context);
    await convex.mutation(api.shipping.syncTracking, {
      shipment_id: body.shipment_id,
      tracking_number: body.tracking_number ? String(body.tracking_number) : undefined,
      status: String(body.status ?? "in_transit"),
      note: body.note ? String(body.note) : undefined,
      tracking_url: body.tracking_url ? String(body.tracking_url) : undefined,
      raw_payload: body,
    });
    console.info("leopards webhook processed", {
      shipment_id: body.shipment_id,
      status: String(body.status ?? "in_transit"),
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
