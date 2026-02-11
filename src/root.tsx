import type {
  HeadersFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteError,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import { api } from "../convex/_generated/api";
import { CartProvider } from "@/hooks/useCart";
import Navigation from "@/components/Navigation";
import MenuDrawer from "@/components/MenuDrawer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppBubble from "@/components/WhatsAppBubble";
import { createConvexClient, getConvexUrl } from "@/lib/convex.server";
import { parseRedirectRules, resolveRedirect, shouldSkipRedirect } from "@/lib/redirects";
import { CANONICAL_ORIGIN, DEFAULT_HOME_SEO, toAbsoluteUrl } from "@/lib/seo";
import indexStyles from "./index.css";
import appStyles from "./App.css";

function buildCsp() {
  const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";
  const connectSrc = isDev
    ? "connect-src 'self' https: wss: ws://localhost:* ws://127.0.0.1:* ws://[::1]:*"
    : "connect-src 'self' https: wss:";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    connectSrc,
    "frame-src 'self' https:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap",
  },
  { rel: "stylesheet", href: indexStyles },
  { rel: "stylesheet", href: appStyles },
  { rel: "icon", href: "/favicon.ico" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const convexUrl = getConvexUrl(context);
  if (!convexUrl) {
    throw new Response("CONVEX_URL is not set", { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  if (incomingUrl.hostname === "ayzalcollections.com") {
    incomingUrl.hostname = "www.ayzalcollections.com";
    return redirect(incomingUrl.toString(), 301);
  }

  const convex = createConvexClient(context);
  const settings = await convex.query(api.siteSettings.get);
  const path = incomingUrl.pathname;
  if (!shouldSkipRedirect(path)) {
    const redirectRules = parseRedirectRules(settings?.data?.redirect_rules);
    const match = resolveRedirect(path, redirectRules);
    if (match) {
      return redirect(match.to, match.status as 301 | 302 | 307 | 308);
    }
  }
  const isAdminRoute = path.startsWith("/admin");
  const [categories, freeShippingPolicy] = isAdminRoute
    ? [[], null]
    : await Promise.all([
        convex.query(api.categories.list),
        convex.query(api.shipping.getFreeShippingPolicy, {}),
      ]);

  return json({
    settings: settings?.data ?? {},
    categories: (categories ?? []).map((category) => ({
      name: category.name,
      slug: category.slug,
    })),
    freeShippingPolicy,
    ENV: {
      CONVEX_URL: convexUrl,
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const seo = { ...DEFAULT_HOME_SEO, ...(data?.settings?.seo ?? {}) };
  const ogImage = toAbsoluteUrl(typeof seo.og_image === "string" ? seo.og_image : "/og.png");

  return [
    { title: seo.title },
    { name: "description", content: seo.description },
    { name: "keywords", content: seo.keywords },
    { property: "og:title", content: seo.title },
    { property: "og:description", content: seo.description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo.title },
    { name: "twitter:description", content: seo.description },
    { name: "twitter:image", content: ogImage },
  ];
};

export const headers: HeadersFunction = () => {
  const out = new Headers();
  out.set("Content-Security-Policy", buildCsp());
  out.set("Referrer-Policy", "strict-origin-when-cross-origin");
  out.set("X-Content-Type-Options", "nosniff");
  out.set("X-Frame-Options", "DENY");
  out.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  out.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  return out;
};

export default function App() {
  const { categories, ENV, settings, freeShippingPolicy } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const brandName = settings?.brand_name ?? "Ayzal Collections";
  const socialLinks = settings?.social_links ?? {};
  const sameAs = [socialLinks.instagram, socialLinks.facebook]
    .filter((value): value is string => typeof value === "string" && /^https?:\/\//.test(value));

  const isAdminRoute = location.pathname.startsWith("/admin");
  const showStoreNav = !isAdminRoute;

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)};`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: brandName,
              url: CANONICAL_ORIGIN,
              logo: toAbsoluteUrl("/og.png"),
              sameAs,
            }),
          }}
        />
      </head>
      <body>
        <CartProvider>
          <div className="relative">
            <div className="grain-overlay" />
            {showStoreNav && (
              <>
                <Navigation onMenuOpen={() => setIsMenuOpen(true)} />
                <MenuDrawer
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  categories={categories}
                />
                <CartDrawer freeShippingThreshold={freeShippingPolicy?.threshold} />
                <WhatsAppBubble />
              </>
            )}
            <main className="relative">
              <Outlet />
            </main>
          </div>
        </CartProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";
  const message = isRouteErrorResponse(error)
    ? error.data?.message ?? "We could not load this page."
    : error instanceof Error
      ? error.message
      : "We could not load this page.";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="bg-[#F6F2EE] text-[#111]">
        <main className="min-h-screen px-6 py-24 flex items-center justify-center">
          <div className="max-w-xl text-center space-y-4">
            <p className="label-text text-[#6E6E6E]">Ayzal Collections</p>
            <h1 className="font-display text-2xl tracking-wide">{title}</h1>
            <p className="text-sm text-[#6E6E6E]">{message}</p>
            <a href="/" className="btn-primary inline-flex">
              Go to homepage
            </a>
          </div>
        </main>
        <Scripts />
      </body>
    </html>
  );
}
