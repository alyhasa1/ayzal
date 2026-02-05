import { RemixServer } from "@remix-run/react";
import type { EntryContext } from "@remix-run/cloudflare";
import * as ReactDOMServer from "react-dom/server.browser";

export default async function handleRequest(
  request: Request,
  status: number,
  headers: Headers,
  context: EntryContext
) {
  if (typeof (globalThis as any).process === "undefined") {
    const hostname = new URL(request.url).hostname;
    const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
    (globalThis as any).process = {
      env: { NODE_ENV: isLocal ? "development" : "production" },
    };
  }

  const body = await (ReactDOMServer as any).renderToReadableStream(
    <RemixServer context={context} url={request.url} />,
    {
      onError(error) {
        console.error(error);
      },
    }
  );

  headers.set("Content-Type", "text/html");
  return new Response(body, { status, headers });
}
