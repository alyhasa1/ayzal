import type {
  HeadersFunction,
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { json, redirect } from "@remix-run/cloudflare";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { useState, useEffect } from "react";
import { api } from "../convex/_generated/api";
import { CartProvider } from "@/hooks/useCart";
import Navigation from "@/components/Navigation";
import MenuDrawer from "@/components/MenuDrawer";
import CartDrawer from "@/components/CartDrawer";
import { createConvexClient, getConvexUrl } from "@/lib/convex.server";
import { parseRedirectRules, resolveRedirect, shouldSkipRedirect } from "@/lib/redirects";
import indexStyles from "./index.css";
import appStyles from "./App.css";

const CANONICAL_BASE = "https://ayzalcollections.com";

function buildCsp() {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: indexStyles },
  { rel: "stylesheet", href: appStyles },
  { rel: "icon", href: "/favicon.ico" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

const defaultSeo = {
  title: "Ayzal Collections | Pakistani Dresses",
  description:
    "Discover Ayzal Collections for pakistani dresses, buy pakistani dresses in lahore, lawn, unstitched lawn, and designer lawn pakistan. Elegant unstitched suits crafted for timeless style.",
  keywords:
    "pakistani dresses, buy pakistani dresses in lahore, lawn, unstitched lawn, designer lawn pakistan",
  og_image: "/og.png",
};

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const convexUrl = getConvexUrl(context);
  if (!convexUrl) {
    throw new Response("CONVEX_URL is not set", { status: 500 });
  }
  const convex = createConvexClient(context);
  const settings = await convex.query(api.siteSettings.get);
  const url = new URL(request.url);
  const path = url.pathname;
  if (!shouldSkipRedirect(path)) {
    const redirectRules = parseRedirectRules(settings?.data?.redirect_rules);
    const match = resolveRedirect(path, redirectRules);
    if (match) {
      return redirect(match.to, match.status as 301 | 302 | 307 | 308);
    }
  }
  const categories = await convex.query(api.categories.list);

  return json({
    settings: settings?.data ?? {},
    categories: (categories ?? []).map((category) => ({
      name: category.name,
      slug: category.slug,
    })),
    ENV: {
      CONVEX_URL: convexUrl,
    },
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const seo = { ...defaultSeo, ...(data?.settings?.seo ?? {}) };
  const ogImage = seo.og_image?.startsWith("http")
    ? seo.og_image
    : `${CANONICAL_BASE}${seo.og_image}`;

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
  const { categories, ENV, settings } = useLoaderData<typeof loader>();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const brandName = settings?.brand_name ?? "Ayzal Collections";
  const socialLinks = settings?.social_links ?? {};
  const sameAs = [socialLinks.instagram, socialLinks.facebook]
    .filter((value): value is string => typeof value === "string" && /^https?:\/\//.test(value));

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAccountRoute = location.pathname.startsWith("/account");
  const showStoreNav = !isAdminRoute && !isAccountRoute;

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
              url: CANONICAL_BASE,
              logo: `${CANONICAL_BASE}/og.png`,
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
                <CartDrawer />
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
