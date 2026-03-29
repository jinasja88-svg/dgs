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
- **Supabase** (Postgres + Auth + Storage) — project ref `bvntczzdjirqtpudfpae` (ap-southeast-1)
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

All product data comes from **TMAPI** (`api.tmapi.io`), a paid third-party REST service wrapping the 1688 API:

- **`client.ts`** — `TmapiClient` class: `searchByKeyword`, `searchByImage`, `getItemDetail` (supports `language=ko` for Korean responses). 15s timeout, 2-retry exponential backoff, rate-limit handling.
- **`types.ts`** — TMAPI raw response types
- **`mapper.ts`** — Maps TMAPI responses to `SourcingProduct` domain model. Three mappers: `mapSearchItemToSourcingProduct`, `mapItemDetailToSourcingProduct`, `mapImageSearchItemToSourcingProduct`
- **`cache.ts`** — LRU cache (500 entries), TTL constants: `CACHE_TTL.SEARCH` (5m), `CACHE_TTL.DETAIL` (15m), `CACHE_TTL.IMAGE_SEARCH` (10m)
- **`errors.ts`** — `TmapiError`, `TmapiRateLimitError`, `TmapiAuthError`
- **`index.ts`** — Singleton `getTmapiClient()` (reads `TMAPI_API_TOKEN`), re-exports `tmapiCache` and `CACHE_TTL`

### Legacy: Direct MTOP Integration (`src/lib/ali1688/`)

Previously used for direct 1688 MTOP protocol calls via Squid proxy. Now replaced by TMAPI. Retained in case direct access is needed (image upload, product page scraping).

### Sourcing API Routes (`src/app/api/sourcing/`)

| Route | Purpose |
|-------|---------|
| `search` | Keyword search — translates Korean→Chinese, calls TMAPI, caches 5 min |
| `product/[id]` | Product detail — TMAPI with `language=ko`, caches 15 min, no Papago needed |
| `image-search` | Image URL search via TMAPI, translates results, caches 10 min |
| `orders` | GET list / POST create sourcing order |
| `orders/[id]` | GET / PATCH single order (status, tracking, admin note) |
| `wishlist` | GET / POST / DELETE — `sourcing_wishlist_items` Supabase table |
| `search-history` | GET / POST / DELETE — `search_history` Supabase table |
| `categories` | Static category list for filter UI |
| `product-page/[id]` | HTML scaffold for product page preview |

### Supabase Clients

Three separate clients for different contexts:

| File | Usage |
|------|-------|
| `src/lib/supabase.ts` | Browser/client components |
| `src/lib/supabase-server.ts` | Server Components (reads cookies) — `createServerSupabaseClient()` |
| `src/lib/supabase-admin.ts` | API routes needing service role (bypasses RLS) — `createAdminClient()` |

Use `createAdminClient()` only in API routes for privileged writes (e.g., `api_call_logs`).

### API Logging

`src/lib/api-logger.ts` wraps TMAPI calls and records to `api_call_logs` (service role only):

```ts
const result = await logApiCall('search', () => client.searchByKeyword(params));
```

### Middleware (`src/middleware.ts`)

- `/mypage`, `/checkout`, `/sourcing-orders` → Redirect to `/login` if unauthenticated
- `/admin/*` → Check against `ADMIN_EMAILS` env var (comma-separated whitelist)
- `/login`, `/signup`, `/reset-password` → Redirect to `/mypage` if already authenticated

### Exchange Rate & Translation

- **`src/lib/exchange-rate.ts`** — Fetches CNY→KRW rate with 1-hour in-memory cache. Falls back to 208 KRW/CNY.
- **`src/lib/translation/`** — Korean↔Chinese via Naver Papago API. Pipeline: static lookup table (`lookup.ts`) → in-memory LRU cache → Papago API call. `translateProducts(products, { skipSkus: true })` used in search/image-search routes (SKU translation only on product detail). Concurrency: 15 products at a time.

### Client-Side State

- **`src/lib/recently-viewed.ts`** — localStorage: 12 most recently viewed products (`ddalkkak-recently-viewed`)
- **`src/lib/cart.ts`** — localStorage cart state
- Recent searches: localStorage key `ddalkkak-recent-searches`; also synced to `search_history` DB table (fire-and-forget POST)

### Shop Page — Infinite Scroll

`src/app/(sourcing)/shop/page.tsx` uses `useInfiniteQuery` (TanStack Query v5):
- Loads 20 products per page
- `IntersectionObserver` on a sentinel element (300px before bottom) triggers `fetchNextPage()`
- `queryKey: ['sourcing-search', keyword, selectedCategory]` — changing either resets the list automatically

### Key Types (`src/types/index.ts` and `src/types/supabase.ts`)

- `SourcingProduct` — 1688 product with dual pricing (CNY + KRW), SKUs, seller info
- `SourcingOrder` — Import order (status: `pending|paid|purchasing|shipping|delivered|cancelled`)
- `Profile` — User with `role: 'user'|'admin'` and subscription plan (`free|basic|pro`)
- `src/types/supabase.ts` — Auto-generated from live schema via `supabase gen types typescript --project-id bvntczzdjirqtpudfpae`. Regenerate after schema changes.

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
TMAPI_API_TOKEN                # TMAPI (api.tmapi.io) subscription token
NAVER_CLIENT_ID                # Papago translation
NAVER_CLIENT_SECRET
ADMIN_EMAILS                   # Comma-separated admin email whitelist
EXCHANGE_RATE_API_KEY          # Optional — paid tier for exchange rates
ALI1688_HTTPS_PROXY            # Optional — legacy Squid proxy (not needed with TMAPI)
```

## Supabase Schema

Schema is managed via `supabase/` directory. Migrations are applied with:
```bash
supabase link --project-ref bvntczzdjirqtpudfpae --password <db-password>
supabase db push
```

Key tables beyond standard auth: `profiles` (with `role` column), `sourcing_orders`, `sourcing_wishlist_items`, `search_history`, `api_call_logs` (deny-all RLS, service role only).

After schema changes, regenerate TypeScript types:
```bash
supabase gen types typescript --project-id bvntczzdjirqtpudfpae 2>/dev/null > src/types/supabase.ts
```
