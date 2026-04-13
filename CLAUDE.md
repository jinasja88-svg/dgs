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
| `(sourcing)` | `/shop`, `/shop/[productId]`, `/cart`, `/sourcing-orders`, `/wishlist`, `/detail-generator` |
| `(user)` | `/mypage`, `/mypage/profile`, `/mypage/addresses`, `/mypage/orders`, `/mypage/reviews` |
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

### Detail Page Generator (`/detail-generator`)

AI-powered Korean marketing page generator. Takes a 1688 product URL → fetches product data + raw HTML description → generates a 13-section high-conversion Korean copy.

- **`src/lib/llm-error.ts`** — `LLMError` base class shared by all LLM providers
- **`src/lib/gemini.ts`** — Google Gemini client (`generate13SectionContent`). Uses native JSON mode (`responseMimeType: 'application/json'`).
- **`src/lib/huggingface.ts`** — HF Serverless client (`Qwen/Qwen2.5-72B-Instruct` by default). Includes `extractJson()` to strip markdown fences from responses; retries up to 3× on JSON parse failure. 90s timeout.
- **`src/app/api/detail-generator/generate/route.ts`** — Selects provider via `LLM_PROVIDER` env var (default: `huggingface`). Set to `gemini` to use Gemini instead.
- **`src/components/detail-generator/`** — `DetailPagePreview` (13-section inline-editable preview), `ExportToolbar` (HTML copy + PNG download via html2canvas), `GenerationProgress`, `EditableText`
- **`src/app/api/sourcing/product-desc/[id]`** — Fetches raw HTML from 1688 `detail_url`, extracts `var offer_details={"content":"..."}`, proxies alicdn images through `/api/image-proxy`

The `Generated13SectionContent` type (in `src/types/index.ts`) defines the full 13-section structure: hero, pain, problem, solution, how_it_works, benefits, social_proof, target_filter, faq, final_cta, trust_text.

### Legacy: Direct MTOP Integration (`src/lib/ali1688/`)

Previously used for direct 1688 MTOP protocol calls via Squid proxy. Now replaced by TMAPI. Retained in case direct access is needed (image upload, product page scraping).

### Sourcing API Routes (`src/app/api/sourcing/`)

| Route | Purpose |
|-------|---------|
| `search` | Keyword search — translates Korean→Chinese, calls TMAPI, caches 5 min |
| `product/[id]` | Product detail — TMAPI with `language=ko`, caches 15 min, no Papago needed |
| `image-search` | Image URL search via TMAPI, translates results, caches 10 min |
| `orders` | GET list / POST create sourcing order (accepts `items[]` array for cart checkout) |
| `orders/[id]` | GET / PATCH single order (status, tracking, admin note, cancellation) |
| `reviews` | GET (by `?order_id=`) / POST — `sourcing_reviews` table; only allowed on `delivered` orders |
| `wishlist` | GET / POST / DELETE — `sourcing_wishlist_items` Supabase table |
| `search-history` | GET / POST / DELETE — `search_history` Supabase table |
| `categories` | Static category list for filter UI |
| `product-page/[id]` | HTML scaffold for product page preview |

`src/app/api/addresses/` — GET/POST shipping addresses; `addresses/[id]` — PATCH/DELETE. Table: `shipping_addresses`.

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

| Utility | Key | Max | Notes |
|---------|-----|-----|-------|
| `src/lib/cart.ts` | `ddalkkak-cart` | 50 items | `addToCart`, `updateCartQty`, `removeFromCart`, `clearCart`, `getCartCount`. Dispatches `cart-updated` custom event on every mutation so `Header` badge stays in sync. Cart items keyed by `product_id + (sku_id \|\| '')`. |
| `src/lib/recently-viewed.ts` | `ddalkkak-recently-viewed` | 12 items | Auto-saved on product detail page visit. Shown on shop homepage when no search active. |
| Recent searches | `ddalkkak-recent-searches` | 10 terms | localStorage primary; `POST /api/sourcing/search-history` fire-and-forget on each search. |
| Wishlist | `ddalkkak-wishlist` | unlimited | localStorage for non-logged-in users. On login, localStorage items are auto-migrated to DB (`sourcing_wishlist_items`) and localStorage is cleared. |

### Shop Page — Infinite Scroll

`src/app/(sourcing)/shop/page.tsx` uses `useInfiniteQuery` (TanStack Query v5):
- Loads 20 products per page
- `IntersectionObserver` on a sentinel element (300px before bottom) triggers `fetchNextPage()`
- `queryKey: ['sourcing-search', keyword, selectedCategory]` — changing either resets the list automatically

### Key Types (`src/types/index.ts` and `src/types/supabase.ts`)

- `SourcingProduct` — 1688 product with dual pricing (CNY + KRW), SKUs, seller info
- `SourcingOrder` — Import order (status: `pending|paid|purchasing|shipping|delivered|cancelled`)
- `SourcingCartItem` — Cart item: `product_id`, `title`, `image`, optional `sku_id`/`sku_name`, `quantity`, `price_cny`, `price_krw`
- `SourcingReview` — Post-delivery review: `order_id`, `rating` (1–5), optional `comment`
- `Profile` — User with `role: 'user'|'admin'`, subscription plan (`free|basic|pro`), and `preferred_categories?: string[]`
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
LLM_PROVIDER                   # huggingface (default) or gemini
HUGGINGFACE_API_TOKEN          # HF Serverless API token (hf_...)
GEMINI_API_KEY                 # Required only when LLM_PROVIDER=gemini
EXCHANGE_RATE_API_KEY          # Optional — paid tier for exchange rates
ALI1688_HTTPS_PROXY            # Optional — legacy Squid proxy (not needed with TMAPI)
```

## Supabase Schema

Schema is managed via `supabase/` directory. Migrations are applied with:
```bash
supabase link --project-ref bvntczzdjirqtpudfpae --password <db-password>
supabase db push
```

Key tables beyond standard auth:

| Table | Notes |
|-------|-------|
| `profiles` | `role` column + `preferred_categories text[]` (added manually) |
| `sourcing_orders` | Order lifecycle; `items jsonb[]` column holds per-product details |
| `sourcing_wishlist_items` | Per-user wishlist; synced from localStorage on login |
| `sourcing_reviews` | One review per order (UNIQUE on `order_id, user_id`); only insertable when order `status = 'delivered'` |
| `search_history` | Keyword search log per user |
| `shipping_addresses` | User delivery addresses with `is_default` flag |
| `api_call_logs` | deny-all RLS, service role only |

New tables (`shipping_addresses`, `sourcing_reviews`) and `preferred_categories` column must be created manually in Supabase SQL Editor — they are **not** in the migrations directory.

After schema changes, regenerate TypeScript types:
```bash
supabase gen types typescript --project-id bvntczzdjirqtpudfpae 2>/dev/null > src/types/supabase.ts
```
