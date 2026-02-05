import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";

export const onRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
});
