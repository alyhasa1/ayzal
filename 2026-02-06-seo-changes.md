# SEO Enhancement Changes — 2026-02-06

## Files Modified

### Convex Backend
- **`convex/schema.ts`** — Added `meta_title` and `meta_description` optional fields to products table
- **`convex/products.ts`** — Added SEO fields to `productFields`, added `pingSitemap` internalAction (auto-pings Google on create/update/remove), enhanced `listSeo` to return `name` and `primary_image_url` for image sitemap

### Frontend Types & Mappers
- **`src/types/index.ts`** — Added `metaTitle` and `metaDescription` to Product interface
- **`src/lib/mappers.ts`** — Mapped `meta_title` → `metaTitle`, `meta_description` → `metaDescription`

### Route-Level SEO
- **`src/routes/product.$slug.tsx`** — Meta function uses admin-defined SEO fields with auto fallback; added `product:price:amount`/`product:price:currency` meta tags; enriched Product JSON-LD with `url`, `category`, `material`, `itemCondition`
- **`src/routes/category.$slug.tsx`** — Replaced `onClick`/`navigate` with Remix `<Link>` for crawlability; improved image alt text; added `loading="lazy"`
- **`src/routes/sitemap[.]xml.ts`** — Added `<changefreq>`, `<priority>`, and `<image:image>` extensions with proper XML namespace

### Admin UI
- **`src/pages/admin/AdminProducts.tsx`** — Added SEO section with `meta_title` and `meta_description` inputs, live character counters (60/160 char limits)

### Product Page
- **`src/pages/ProductPage.tsx`** — Replaced related product `<button onClick>` with `<Link>`; improved image alt text with category context; added `loading="lazy"` to thumbnails

### Site-Wide
- **`src/root.tsx`** — Added `Organization` JSON-LD (name, url, logo)
- **`public/site.webmanifest`** — Fixed empty `name`/`short_name` → "Ayzal Collections"/"Ayzal"

## One-Time Manual Step
- Submit `https://ayzalcollections.com/sitemap.xml` in Google Search Console (after that, auto-ping handles updates)
