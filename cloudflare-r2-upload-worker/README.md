# Ayzal R2 Upload Worker

Cloudflare Worker for image uploads to R2, used by Admin Sections UI.

## What it does

- Accepts authenticated `POST /v1/images/upload` image uploads.
- Stores files in R2 with long-lived cache headers.
- Returns a ready-to-use public URL for storefront/admin usage.
- Can serve files directly via `GET /files/{key}` if `PUBLIC_BASE_URL` is not set.

## Required secrets and vars

Set these in the worker:

1. `UPLOAD_TOKEN` (secret): shared secret used by backend upload proxy.
2. `PUBLIC_BASE_URL` (var): CDN/domain base, e.g. `https://cdn.ayzalcollections.com`.
3. `ALLOWED_ORIGINS` (var): comma-separated origins allowed for CORS.
4. `MAX_UPLOAD_BYTES` (var): upload size cap, e.g. `10485760` for 10 MB.

Set the matching vars in Remix/Pages:

1. `IMAGE_UPLOAD_WORKER_URL`: worker URL, e.g. `https://ayzalcollections-r2-upload.<account>.workers.dev`
2. `IMAGE_UPLOAD_WORKER_TOKEN`: same value as worker `UPLOAD_TOKEN`
3. `IMAGE_UPLOAD_MAX_BYTES` (optional): max upload size enforced by proxy route

## Deploy

```bash
cd cloudflare-r2-upload-worker
wrangler secret put UPLOAD_TOKEN
wrangler deploy
```

## Integration endpoint

Admin UI uploads to Remix route:

- `POST /api/admin/upload-image`

This route verifies admin auth using Convex auth cookies, then forwards to this worker.
