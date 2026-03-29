# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**딸깍소싱(Ddalkkak Sourcing)** — A Next.js full-stack platform for sourcing Chinese products via the 1688 (Alibaba) wholesale marketplace. Users search 1688 by keyword or image, browse products with KRW pricing, and submit sourcing orders. Admins manage orders and monitor API usage.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

No test runner is configured.

## Architecture

### Tech Stack
- **Next.js 16** (App Router) + React 19 + TypeScript 5
- **Tailwind CSS 4** with `@tailwindcss/postcss`
- **Supabase** (Postgres + Auth + Storage)
- **TanStack Query v5** for client-side data fetching
- Path alias: `@/*` → `src/*`

### Route Groups
The `src/app/` directory uses Next.js route groups (parentheses):

| Group | Routes |
|-------|--------|
| `(sourcing)` | `/shop`, `/shop/[productId]`, `/sourcing-orders`, `/wishlist`, `/detail-generator` |
| `(user)` | `/mypage`, `/mypage/profile`, `/mypage/orders`, `/mypage/reviews` |
| `(auth)` | `/login`, `/signup`, `/reset-password` |
| `(checkout)` | `/checkout/success` |
| `(info)` | `/about`, `/faq`, `/terms`, `/privacy`, `/contact`, `/notices` |
| `admin` | `/admin`, `/admin/sourcing-orders`, `/admin/orders`, `/admin/users`, `/admin/api-monitor` |

Home (`/`) redirects to `/shop`.

### 1688 API Integration — TMAPI (`src/lib/tmapi/`)

The core of the product uses **TMAPI** (`api.tmapi.top`), a paid third-party API service for 1688 data:

- **`client.ts`** — `TmapiClient` class with `searchByKeyword`, `searchByImage`, `getItemDetail`, `convertImageUrl`. Includes retry logic with exponential backoff and timeout handling.
- **`types.ts`** — TMAPI raw response types (`TmapiSearchResult`, `TmapiItemDetail`, `TmapiImageSearchResult`)
- **`mapper.ts`** — Maps TMAPI responses to `SourcingProduct` domain models
- **`cache.ts`** — LRU cache (500 entries) with TTL (search: 5m, detail: 15m, image-search: 10m)
- **`errors.ts`** — `TmapiError`, `TmapiRateLimitError`, `TmapiAuthError`
- **`index.ts`** — Singleton `getTmapiClient()` (reads `TMAPI_API_TOKEN` env var), exports

### Legacy: Direct MTOP Integration (`src/lib/ali1688/`)

Previously used direct MTOP protocol integration (now replaced by TMAPI). Still used for the product page HTML proxy (`product-page/[id]/route.ts`).

- **`mtop.ts`** — Low-level MTOP request handler with token management and proxy support
- **`client.ts`** — Direct 1688 API operations (keyword search, image search, item detail scraping)
- **`mapper.ts`** — Maps raw 1688 API responses to `SourcingProduct` domain models

### Supabase Clients

Three separate clients for different contexts:

| File | Usage |
|------|-------|
| `src/lib/supabase.ts` | Browser/client components |
| `src/lib/supabase-server.ts` | Server Components (reads cookies) |
| `src/lib/supabase-admin.ts` | API routes needing service role (bypasses RLS) |

Use `createAdminClient()` only in API routes for privileged writes (e.g., `api_call_logs`).

### API Logging

`src/lib/api-logger.ts` wraps 1688 API calls and records to the `api_call_logs` Supabase table:

```ts
const result = await logApiCall('search', () => searchByKeyword(params));
```

Logs `endpoint`, `duration_ms`, `success`, `error_msg`. Logging failures are silently ignored. The `api_call_logs` table has RLS enabled with a deny-all policy — only the service role key can write.

### Middleware (`src/middleware.ts`)

- `/mypage`, `/checkout`, `/sourcing-orders` → Redirect to `/login` if unauthenticated
- `/admin/*` → Check against `ADMIN_EMAILS` env var (comma-separated whitelist)
- `/login`, `/signup`, `/reset-password` → Redirect to `/mypage` if already authenticated

### Exchange Rate & Translation

- **`src/lib/exchange-rate.ts`** — Fetches CNY→KRW rate with 1-hour in-memory cache. Falls back to 208 KRW/CNY if APIs fail.
- **`src/lib/translation/`** — Korean↔Chinese translation via Naver Papago API, with a static lookup table for common terms and in-memory session cache.

### Key Types (`src/types/index.ts`)

- `SourcingProduct` — 1688 product with dual pricing (CNY + KRW), SKUs, seller info
- `SourcingOrder` — Import order (status: `pending|paid|purchasing|shipping|delivered|cancelled`)
- `Profile` — User with subscription plan (`free|basic|pro`)

### UI Components

- `src/components/ui/` — Badge, Button, Input, Modal, Pagination, Skeleton, Breadcrumb
- `src/components/layout/` — Header, Footer, MobileMenu
- Utility: `cn()` from `src/lib/utils.ts` (classname merger)
- Status helpers: `getSourcingStatusLabel()`, `getOrderStatusLabel()` from `src/lib/utils.ts`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # Required for api-logger and admin operations
TMAPI_API_TOKEN                # TMAPI (api.tmapi.top) subscription token for 1688 API
ALI1688_HTTPS_PROXY            # Squid proxy — legacy, not needed with TMAPI
NAVER_CLIENT_ID                # Papago translation
NAVER_CLIENT_SECRET
ADMIN_EMAILS                   # Comma-separated admin email whitelist
EXCHANGE_RATE_API_KEY          # Optional paid tier for exchange rates
```

## Supabase Schema Notes

The `api_call_logs` table was created manually (not via migrations):
```sql
CREATE TABLE api_call_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint text NOT NULL,  -- 'search' | 'image-search' | 'product'
  duration_ms integer,
  success boolean NOT NULL,
  error_msg text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE api_call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON api_call_logs USING (false);
```

## Infrastructure

- **ECS Instance**: Alibaba Cloud cn-shanghai, `i-uf66j50e8wkhf1trvf63`, IP `8.153.18.156`
- **Squid Proxy**: Running on port 3128, routes `.1688.com` traffic
- **Supabase Project**: `gppserrdbfznhcekafaz` (region: ap-southeast-1)
- The ECS instance is PrePaid (monthly), **not** PAYG — check expiry before making changes
