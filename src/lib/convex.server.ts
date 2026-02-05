import { ConvexHttpClient } from "convex/browser";
import type { AppLoadContext } from "@remix-run/cloudflare";

export function getConvexUrl(context?: AppLoadContext) {
  const env = (context?.cloudflare?.env ?? process.env) as Record<
    string,
    string | undefined
  >;
  return env.CONVEX_URL ?? env.VITE_CONVEX_URL;
}

export function createConvexClient(context?: AppLoadContext) {
  const url = getConvexUrl(context);
  if (!url) {
    throw new Error("CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}
