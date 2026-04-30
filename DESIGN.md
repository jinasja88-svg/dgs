# DESIGN.md — 딸깍소싱 디자인 시스템

> Airbnb 스타일의 "사진 중심 · 단일 액센트 · 모던 마켓플레이스" 톤을 딸깍소싱 컨텍스트(1688 상품 검색·소싱 주문 플랫폼)에 맞게 적응한 디자인 가이드.

## 1. Overview

딸깍소싱은 1688 상품 사진이 페이지 시각 무게를 책임지는 **사진 중심 마켓플레이스**입니다. 따라서 디자인은 사진을 거스르지 않는 **white-canvas + 단일 액센트** 노선으로 통일합니다.

기준 캔버스는 순백(`{colors.canvas}` — `#ffffff`), 본문/헤드라인은 거의 흑색에 가까운 잉크(`{colors.ink}` — `#222222`), 그리고 **단 하나의 voltage**인 딸깍 레드(`{colors.primary}` — `#ff385c`)가 기본 CTA, 검색 오브, 찜 하트, 브랜드 워드마크를 모두 담당합니다. 보조 브랜드 컬러는 두지 않습니다 — 메인 페이지의 90%는 화이트와 잉크, 5–10%만 액센트.

타이포는 이미 프로젝트에 로드된 **Pretendard Variable**을 그대로 사용합니다(한국어 Airbnb Cereal 대체로 가장 자연스러움). Display 헤드라인은 22–28px / 500–600의 **온건한 무게**에 머무르며, 두꺼운 700+는 평점 숫자 같은 단일 신뢰 신호에만 한정합니다 — 사진이 시각 위계를 책임지므로 타이포는 무게로 경쟁하지 않습니다.

쉐입은 **부드럽게**. 버튼은 8px radius, 상품 카드는 14px, 검색바와 찜 하트와 검색 오브는 완전한 pill/원형, 카테고리 칩은 32px. 본문 그리드 외에 각진 모서리는 거의 두지 않습니다.

**Key Characteristics**
- 단일 액센트: `{colors.primary}` (`#ff385c`) — primary CTA, 검색 오브, 찜 하트, 워드마크. 페이지당 1–2개의 voltage 모먼트만.
- Pretendard Variable 단일 패밀리. Display 500–600, body 400. 사진이 무게를 지므로 타이포는 modest.
- Pill-shaped 글로벌 검색바: 화이트 면, fully rounded, hairline으로 키워드 / 이미지 / 카테고리 세그먼트 분할, 우측 끝에 원형 Rausch 검색 오브.
- 사진 우선 상품 카드: 1:1 비율, 14px corner-clip, 좌상단 "베스트셀러" 배지, 우상단 찜 하트, 하단 4–5줄 메타.
- 단일 섀도우 티어 — 카드 hover, dropdown, 검색바 rest 상태에만 적용. 깊이는 사진과 코너 클립으로 만듭니다.
- 8px 베이스 그리드, 섹션 64px — SaaS 마케팅 페이지보다 빡빡하게 짜야 마켓플레이스 카드 밀도가 살아납니다.

## 2. Colors

### Brand & Accent
| 토큰 | Hex | 용도 |
|---|---|---|
| `{colors.primary}` (Rausch) | `#ff385c` | 모든 primary CTA, 검색 오브, 찜 하트 활성, 브랜드 워드마크, 상품 페이지 "주문하기" |
| `{colors.primary-active}` | `#e00b41` | 버튼 press / pointer-down |
| `{colors.primary-disabled}` | `#ffd1da` | 비활성 CTA |
| `{colors.primary-hover-bg}` | `#fff1f3` | tertiary 버튼 hover 배경 (옅은 핑크 wash) |

> **마이그레이션 참고**: 현재 `globals.css`의 `--color-point: #d63d4a` 가 이미 Rausch에 매우 가깝습니다. 채도를 한 단계 올린 `#ff385c`로 전환하면 마켓플레이스 voltage가 살아납니다. 기존 `--color-primary: #256ef4` (KRDS 블루) 는 마켓플레이스 톤과 어긋나므로 **단계적으로 폐기**하고 모든 primary surface를 Rausch로 통일할 것을 권장합니다.

### Surface
| 토큰 | Hex | 용도 |
|---|---|---|
| `{colors.canvas}` | `#ffffff` | 모든 공개 페이지 기본 floor (다크모드 없음) |
| `{colors.surface-soft}` | `#f7f7f7` | 비활성 인풋, 서브내비 hover, 검색 필터 밴드 |
| `{colors.surface-strong}` | `#f2f2f2` | 원형 아이콘 버튼 면, 카테고리 칩 비활성 |

### Hairlines & Borders
| 토큰 | Hex | 용도 |
|---|---|---|
| `{colors.hairline}` | `#dddddd` | 1px 기본 border — 검색바 분할선, 카드 outline, 푸터 분할선 |
| `{colors.hairline-soft}` | `#ebebeb` | 긴 본문 섹션 사이의 옅은 분할선 |
| `{colors.border-strong}` | `#c1c1c1` | 비활성 outline 버튼, 인풋 default outline |

### Text
| 토큰 | Hex | 용도 |
|---|---|---|
| `{colors.ink}` | `#222222` | 헤드라인, 본문, 메인 nav 링크, 별점 숫자 — pure black은 사용 안 함 |
| `{colors.body}` | `#3f3f3f` | 긴 리뷰/상품 설명 본문 |
| `{colors.muted}` | `#6a6a6a` | 카드 서브타이틀, 비활성 탭 라벨, 푸터 카테고리 |
| `{colors.muted-soft}` | `#929292` | 비활성 링크 텍스트 |
| `{colors.on-primary}` | `#ffffff` | Rausch 위 텍스트 |

> **별점 색상 정책**: 1688 상품 평점 / 셀러 평점 숫자는 **잉크 색**(`#222`)으로 렌더합니다. 노란/금색 별은 마켓플레이스 컨텍스트에서 싸구려처럼 보이므로 의도적으로 회피합니다.

### Semantic
| 토큰 | Hex | 용도 |
|---|---|---|
| `{colors.error}` | `#c13515` | 폼 검증 에러 텍스트, "재고 없음" 라벨 — Rausch보다 한 단 darker/saturated |
| `{colors.error-hover}` | `#b32505` | 에러 링크 hover |
| `{colors.success}` | `#0e7c3a` | "배송 완료" 상태 라벨 — 사용 매우 제한적 |
| `{colors.legal-link}` | `#428bff` | 약관/개인정보 본문 인라인 링크에만 사용 |

### Scrim
- `{colors.scrim}` — `#000000` at 50% opacity. 모달 백드롭 (날짜 피커, 이미지 검색 업로더, SKU 선택, 로그인 다이얼로그).

### 주문 상태 컬러 (예외 케이스)
주문 상태 라벨은 정보 전달이 1순위이므로 의미 컬러를 허용합니다 — 단 Badge 컴포넌트 안에서만 사용하고 페이지 레벨로 새지 않게 합니다.

| 상태 | 토큰 | Hex |
|---|---|---|
| `pending` | `{colors.muted}` | `#6a6a6a` 옅은 회색 칩 |
| `paid` | `{colors.info}` | `#0b78cb` |
| `purchasing` | `{colors.warning}` | `#b86e00` |
| `shipping` | `{colors.primary}` | `#ff385c` |
| `delivered` | `{colors.success}` | `#0e7c3a` |
| `cancelled` | `{colors.muted-soft}` | `#929292` |

## 3. Typography

### Font Family
- **Primary**: `Pretendard Variable` (이미 `globals.css`에 jsdelivr CDN으로 로드됨)
- **Fallback stack**: `Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Helvetica Neue", "Apple SD Gothic Neo", sans-serif`
- 별도 display 패밀리 없음. 변동 폰트 하나가 전체 스케일을 담당.

> Pretendard는 한국어 본문에서 Inter/Cereal과 가장 가까운 광학을 가진 오픈소스 폰트입니다. Cereal 대체가 자연스러운 단 하나의 선택지.

### Hierarchy

| 토큰 | Size | Weight | Line Height | Letter Spacing | 용도 |
|---|---|---|---|---|---|
| `{typography.rating-display}` | 56px | 700 | 1.1 | -1px | 상품 상세의 평점 디스플레이 ("4.81") — 시스템 내 가장 큰 타입 모먼트 |
| `{typography.display-xl}` | 28px | 700 | 1.43 | -0.3px | Shop 홈 h1 ("오늘의 1688 추천") |
| `{typography.display-lg}` | 22px | 600 | 1.2 | -0.4px | 상품 상세 h1 (1688 상품 타이틀) |
| `{typography.display-md}` | 21px | 700 | 1.43 | 0 | 상품 상세 섹션 헤드 ("이 상품의 SKU", "셀러 정보") |
| `{typography.display-sm}` | 20px | 600 | 1.2 | -0.18px | 서브 섹션 ("관련 상품", "리뷰") |
| `{typography.title-md}` | 16px | 600 | 1.25 | 0 | 카드 타이틀, 카테고리 블록 헤드 |
| `{typography.title-sm}` | 16px | 500 | 1.25 | 0 | 푸터 컬럼 헤드 ("고객지원", "소싱 안내", "딸깍소싱") |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | 기본 본문 (상품 설명, 리뷰) |
| `{typography.body-sm}` | 14px | 400 | 1.43 | 0 | 카드 메타, 가격(KRW), 거리, 날짜 |
| `{typography.caption}` | 14px | 500 | 1.29 | 0 | 검색바 세그먼트 라벨 ("키워드", "이미지", "카테고리") |
| `{typography.caption-sm}` | 13px | 400 | 1.23 | 0 | 푸터 법적 고지 ("© 2026 딸깍소싱") |
| `{typography.badge}` | 11px | 600 | 1.18 | 0 | 카드 위 floating 배지 ("베스트셀러", "신상품") |
| `{typography.micro-label}` | 12px | 700 | 1.33 | 0 | 카드 amenity 마이크로 라벨 ("MOQ 1", "환율 적용") |
| `{typography.uppercase-tag}` | 8px | 700 | 1.25 | 0.32px (uppercase) | "NEW" 배지 — 한국어 페이지에서는 사용 매우 제한적, 영문 라벨에만 |
| `{typography.button-md}` | 16px | 500 | 1.25 | 0 | primary CTA 라벨 |
| `{typography.button-sm}` | 14px | 500 | 1.29 | 0 | pill 버튼 (카테고리 칩) |
| `{typography.link}` | 14px | 400 | 1.43 | 0 | 인라인 본문 링크 |
| `{typography.nav-link}` | 16px | 600 | 1.25 | 0 | 헤더 nav 라벨 (검색 / 장바구니 / 마이페이지) |

### Principles
- Display 무게는 modest. Shop 홈 h1는 28px / 700이지만 검색바와 카테고리 그리드 사이에 끼워넣는 조연 — 사진 그리드가 시각 위계를 짊어짐.
- 시스템 안에서 **타이포가 단독으로 무게를 짊어지는 모먼트는 평점 디스플레이 단 하나**. 평점은 신뢰 신호이므로 56px / 700로 가장 크게.
- 한국어 본문은 가독성을 위해 **line-height 1.5–1.6**, 영문 동등 권장값보다 한 단 높게.
- 현재 `globals.css`의 `body { font-size: 17px }` 는 16px로 한 단 낮춰 Airbnb 톤 밀도에 맞춥니다.

## 4. Layout

### Spacing System
- **Base unit**: 4px (마이크로는 2px).
- **Tokens**: `{spacing.xxs}` 2 · `{spacing.xs}` 4 · `{spacing.sm}` 8 · `{spacing.md}` 12 · `{spacing.base}` 16 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.xxl}` 48 · `{spacing.section}` 64.
- **섹션 vertical padding**: 64px — SaaS 마케팅의 80–96px보다 빡빡하게 짜야 카드 per scroll 수가 늘어남.
- **카드 internal padding**: 24px (`reservation-card`, `host-card`), 16px (상품 카드 메타 블록), 8px (캡션·날짜 거터).
- **그리드 gutter**: 16px (Shop 카드 그리드), 24px (푸터 컬럼), 4px (카테고리 칩 사이).

### Grid & Container
- **Max content width**: 1280px (Shop, 정보 페이지). 상품 상세는 1080px로 더 좁게 — 사진 배너와 sticky 주문 카드의 가독성 우선.
- **상품 그리드 (Shop 홈)**:
  - Mobile (<744px): 2-up
  - Tablet (744–1128): 3-up
  - Desktop (1128–1440): 4-up
  - Wide (>1440): 5-up — 사이즈 캡 후 거터 흡수
- **상품 상세**: 2-column — 좌측 사진/스펙 본문 (~64%) · 우측 sticky `{component.sourcing-order-card}` (~32%).
- **푸터**: 데스크톱 3-column (고객지원 / 소싱 안내 / 딸깍소싱), 모바일 1-column.

### Whitespace Philosophy
에디토리얼 밴드는 64px 호흡, 카드 그리드는 16px로 압축. "오픈된 hero — 빡빡한 마켓플레이스" 대비가 마켓플레이스 본질을 강화.

## 5. Elevation

시스템은 **단 하나의 섀도우 티어**와 flat baseline만 가집니다.

```css
/* {shadow.float} — 시스템 내 유일한 섀도우 정의 */
box-shadow:
  rgba(0, 0, 0, 0.02) 0 0 0 1px,
  rgba(0, 0, 0, 0.04) 0 2px 6px 0,
  rgba(0, 0, 0, 0.1)  0 4px 8px 0;
```

- **Flat (no shadow)**: 본문, hero, 푸터, 모든 에디토리얼 밴드 — 표면의 95%.
- **`{shadow.float}` 적용**: 상품 카드 hover, 검색바 rest, dropdown(계정 메뉴, 카테고리 dropdown, 날짜 피커, 이미지 검색 업로더, 마이페이지 메뉴).
- **모달 scrim**: `{colors.scrim}` 50% opacity.

> **마이그레이션**: 현재 `globals.css`는 `--shadow-sm/-card/-card-hover/-md/-lg/-xl` 6단계를 정의하고 있습니다. **모두 폐기**하고 `--shadow-float` 단일 토큰만 남깁니다. 깊이는 사진과 코너 클립이 만듭니다.

```css
/* 신규 — 기존 6단 섀도우 토큰 대체 */
--shadow-float:
  rgba(0,0,0,0.02) 0 0 0 1px,
  rgba(0,0,0,0.04) 0 2px 6px 0,
  rgba(0,0,0,0.1)  0 4px 8px 0;
```

## 6. Components

### 6.1 Buttons (`src/components/ui/Button.tsx` 리팩터)

| 토큰 | 정의 |
|---|---|
| `{component.button-primary}` | Rausch fill, 흰 텍스트, 8px radius, 14×24px padding, 48px height, weight 500. "주문하기 / 장바구니 담기 / 검색 / 결제" |
| `{component.button-primary-active}` | 배경 → `{colors.primary-active}`. transform·shadow 변화 없음 |
| `{component.button-primary-disabled}` | `#ffd1da` fill + 흰 텍스트, `cursor: not-allowed` |
| `{component.button-secondary}` | 흰 fill + 잉크 텍스트 + 1px 잉크 outline, 8px radius. "취소 / 저장 / 뒤로" |
| `{component.button-tertiary-text}` | 잉크 텍스트, 면·border 없음. hover 시 underline. "더보기 / 모달 닫기" |
| `{component.button-pill-rausch}` | pill (9999px), 10×20px padding, 14px / 500 라벨. "셀러 되기" 같은 보조 CTA |
| `{component.button-pill-ghost}` | 카테고리 칩 — 흰 fill + hairline border, 8px / 16px padding, 14px / 500 |

> 현재 `Button.tsx`의 5 variants(primary/secondary/tertiary/ghost/danger)는 그대로 두되, **스타일을 위 토큰에 맞춰 교체**합니다. KRDS 블루 → Rausch 레드, 6px → 8px radius, `font-bold leading-150` → `font-medium leading-125`.

### 6.2 Search Surface

**`{component.search-bar-pill}`** — 글로벌 검색바. 흰 fill, 9999px radius, 64px height, 1px hairline border + `{shadow.float}`. 내부는 vertical hairline으로 3 세그먼트 분할:

```
[ 키워드     ] | [ 이미지 검색 ] | [ 카테고리 ] [🔍]
  Where        |    What        |   When       (orb)
```

각 세그먼트는 위에 `{typography.caption}` 라벨, 아래에 `{typography.body-md}` placeholder.

**`{component.search-orb}`** — 검색바 우측 끝 원형 Rausch 오브. 48×48, fully rounded, 흰 magnifying-glass 아이콘 중앙. **홈에서 가장 hot한 단일 컬러 모먼트**.

**`{component.search-bar-mobile}`** — 모바일에서는 단일 tappable pill로 collapse, 탭 시 full-screen 검색 오버레이.

### 6.3 Top Navigation (`src/components/layout/Header.tsx` 리팩터)

**`{component.top-nav}`** — 흰 면, 64–80px height, 1px bottom hairline. 좌측 워드마크(딸깍소싱, Rausch) — 중앙 product tab 셋 — 우측 utilities(찜 / 장바구니 / 계정).

**제품 탭 3종** (Airbnb의 Homes/Experiences/Services 매핑):
| 탭 | 한국어 라벨 | 32px 아이콘 |
|---|---|---|
| `shop` | 상품 검색 | 🛍️ 핸드 일러스트 (활성 default) |
| `image-search` | 이미지 검색 | 📷 |
| `detail-generator` | 상세페이지 생성 | ✨ — `NEW` 배지 부착 |

**`{component.product-tab-active}`** — 잉크 라벨 (`{typography.nav-link}`), 32px 일러스트 아이콘, 아이콘-라벨 페어 아래 2px 잉크 underline.

**`{component.product-tab-inactive}`** — muted 라벨, underline 없음.

**`{component.new-tag}`** — 32×32 아이콘 우상단에 anchor된 작은 rounded pill, `{typography.uppercase-tag}` "NEW" 라벨. **신규 출시 기능에만**(상세페이지 생성 등) 한정.

### 6.4 Product Cards (Shop 그리드의 핵심)

**`{component.product-card}`** — 사진 우선 카드.
- 1:1 사진 plate, `{rounded.md}` 14px corner-clip
- 좌상단 floating 배지 — `{component.bestseller-badge}` ("베스트셀러" / "신상품" / "할인")
- 우상단 `{component.icon-button-circle}` — 찜 하트 (default outlined, saved 시 Rausch fill)
- 사진 위 캐러셀 dot indicator
- 사진 아래 4–5줄 메타:
  ```
  타이틀(title-md, 잉크, 2-line clamp)
  셀러명 / MOQ (body-sm, muted)
  ★ 4.81 · 평가 12k+ (body-sm, 잉크 별)
  ¥ 32 ≈ ₩ 6,650 (body-md, 잉크, 좌측)        + 찜 토글 (우측)
  ```

**`{component.product-card-photo}`** — 사진 plate를 별도 토큰으로 분리. 찜 페이지·검색 결과·최근 본 상품에서 메타 없이 재사용.

**`{component.bestseller-badge}`** — 흰 rounded pill (`{rounded.full}`), 11px / 600. `{shadow.float}`로 사진 위 elevation. 한국어 라벨 권장: "베스트", "신상품", "쿠폰".

**`{component.icon-button-circle}`** — 32×32 원형, 흰 면 (`{colors.surface-strong}` semi-transparent), 잉크 아이콘. hover 시 `{shadow.float}`. 찜 / 장바구니 quick-add / 공유에 사용.

### 6.5 Product Detail (`/shop/[productId]`)

**`{component.rating-display-card}`** — 시스템 시그니처 모먼트.
```
   🌿  4.81  🌿
       ▔▔▔▔
   1688 인기 셀러 · 평가 12,400+
   ┌─────┬─────┬─────┬─────┐
   │ 평점 │ 리뷰 │  MOQ │ 환율 │
   └─────┴─────┴─────┴─────┘
```
56px / 700 평점 숫자, 좌우 작은 월계관 SVG. 시스템 내 최대 타입 모먼트.

**`{component.spec-row}`** — SKU·옵션·스펙 1-column 리스트. 아이콘 + `{typography.body-md}` 잉크 라벨, 12px 행 padding, 행간 border 없음, 섹션 위·아래 1px hairline.

**`{component.reviews-card}`** — 2-column 리뷰 grid. 각 컬럼: 작성자 row(아바타/이름/날짜) → 3줄 excerpt → "더보기" tertiary 링크. 한국어 본문은 line-height 1.6.

**`{component.seller-card}`** — 흰 카드, `{rounded.md}` 14px, 24px padding. 셀러 아바타 + 이름 + "1688 인증" 배지 + 응답률 stat + `{component.button-secondary}` "셀러 다른 상품 보기".

**`{component.sourcing-order-card}`** — 우측 sticky 주문 카드. 흰 면, 14px radius, 1px hairline + `{shadow.float}`, 24px padding. 구성:
- 단가 (`{typography.display-md}` 잉크) + 단위 ("¥ / 개")
- KRW 환산 가격 (`{typography.body-md}` muted)
- SKU 선택 selector
- 수량 stepper
- "주문하기" `{component.button-primary}` full-width
- 비용 분해 stack (`{typography.body-sm}`):
  ```
  상품가  ₩ 6,650 × 10
  수수료  ₩ 7,980 (12%)
  배송비  ₩ 18,000
  ─────────────
  총합    ₩ 91,480
  ```

### 6.6 Date / Quantity / SKU Picker

**`{component.date-picker-day}`** — 40×40 원형 cell, `{typography.body-sm}` 잉크. 기본 transparent fill.

**`{component.date-picker-day-selected}`** — 잉크 fill + 흰 텍스트 + `{rounded.full}`. range 사이 lozenge는 `{colors.surface-soft}` 배경.

**`{component.qty-stepper}`** — `[−]  3  [+]` 형태. `−`/`+` 는 32×32 `{component.icon-button-circle}`, 숫자는 `{typography.body-md}` 잉크 24px 가로 스페이서.

### 6.7 Forms (`src/components/ui/Input.tsx` 리팩터)

**`{component.text-input}`** — 흰 fill, 1px hairline outline, 8px radius, 56px height, 14×12px padding. 라벨은 stack 위에 `{typography.caption}` muted. focus 시 border 2px 잉크로 두꺼워짐(글로우·링 없음).

**`{component.text-input-error}`** — border `{colors.error}`, 아래 helper 텍스트 `{typography.body-sm}` `{colors.error}`.

### 6.8 Footer (`src/components/layout/Footer.tsx`)

**`{component.footer-light}`** — 흰 면(딸깍소싱은 contrast footer 없음 — 캔버스와 동일), 48–80px padding. 3-column:
- 고객지원: FAQ / 1:1 문의 / 공지사항
- 소싱 안내: 수수료 안내 / 배송 안내 / 환불 정책
- 딸깍소싱: 회사 소개 / 이용약관 / 개인정보처리방침

각 컬럼 헤드는 `{typography.title-sm}`, 링크 행은 `{component.footer-link}` (`{typography.body-sm}` 잉크).

**`{component.legal-band}`** — 푸터 하단 strip. 저작권("© 2026 딸깍소싱"), 언어 picker(globe + "한국어"), 통화 picker("KRW ₩"), 소셜 아이콘. 모두 `{colors.muted}` `{typography.caption-sm}`.

### 6.9 Wishlist / Cart Badge

**`{component.cart-count-badge}`** — 헤더 카트 아이콘 우상단 16×16 원형 Rausch fill, 흰 11px / 700 숫자. 카트 변경 시 `cart-updated` 이벤트로 동기화 (현재 `src/lib/cart.ts` 패턴 유지).

### 6.10 Order Status Chip

**`{component.status-chip}`** — `{rounded.full}` pill, 8×12px padding, `{typography.body-sm}` weight 500. 상태별 컬러는 §2 "주문 상태 컬러" 표 따름.

## 7. Responsive Behavior

| Name | Width | Key Changes |
|---|---|---|
| **Mobile** | < 744px | top nav → 로고 + 햄버거. 제품 탭 → bottom sheet. 검색바 → 단일 pill. 상품 카드 → 2-up. 상품 상세 sourcing-order-card → 화면 하단 sticky bar (단가 + "주문하기"만). |
| **Tablet** | 744–1128 | top nav 유지하되 검색바 narrow. 상품 카드 3-up. sourcing-order-card sticky right-rail (좁은 폭). |
| **Desktop** | 1128–1440 | full top nav, 검색바 3-segment 모두 visible. 상품 카드 4-up. 상품 상세 2-column. |
| **Wide** | > 1440 | content cap 1440(상품 상세는 1080), 거터 흡수. 상품 카드 5-up까지 허용. |

### Touch Targets
- primary CTA 최소 48×48 (WCAG AAA 충족).
- 검색 오브 48×48 — 페이지 최다 tap 요소.
- 찜 하트 32×32 — pad 12px로 effective tap target 56×56 확보.
- 날짜 피커 day cell 40×40.

### Collapsing Strategy
- Top 제품 탭은 < 744px에서 햄버거 sheet로 collapse.
- 검색바 3 세그먼트는 모바일에서 단일 tap entry → full-screen 검색 오버레이.
- 그리드는 row reflow 금지, **column 수만 단계 감소**.
- sourcing-order-card는 모바일에서 sticky right-rail → sticky bottom bar 전환 (단가 + "주문하기" CTA만).

## 8. Migration Guide — KRDS → 딸깍 마켓플레이스 톤

현재 `src/app/globals.css`에서 정리할 항목:

### 8.1 색상 토큰
| 폐기 | 신규 |
|---|---|
| `--color-primary: #256ef4` (KRDS 블루 전체 ramp) | `--color-primary: #ff385c` (단일 voltage, ramp 없음) |
| `--color-secondary-*` 전체 | 폐기 (보조 브랜드 컬러 두지 않음) |
| `--color-point: #d63d4a` | `--color-primary`로 통합 |
| `--color-gray-*` 12단계 ramp | `--color-canvas / surface-soft / surface-strong / hairline / hairline-soft / border-strong / ink / body / muted / muted-soft` 10개로 슬림화 |

### 8.2 Radius
| 폐기 | 신규 |
|---|---|
| `--radius-xs: 2px`, `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 10px`, `--radius-xl: 12px` | `--rounded-sm: 8px` (버튼/인풋), `--rounded-md: 14px` (카드), `--rounded-xl: 32px` (카테고리 칩), `--rounded-full: 9999px` (검색바/하트/오브) |

### 8.3 Shadow
| 폐기 | 신규 |
|---|---|
| `--shadow-sm`, `--shadow-card`, `--shadow-card-hover`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` 6단계 | `--shadow-float` 단 1개 |

### 8.4 Typography
| 폐기 | 신규 |
|---|---|
| `body { font-size: 17px; line-height: 150% }` | `body { font-size: 16px; line-height: 1.5 }` |
| `h1–h6 { font-weight: 700 }` 일괄 | display-xl/lg/md/sm 각각 700/600/700/600로 분화 |

### 8.5 Component
| 파일 | 변경 |
|---|---|
| `src/components/ui/Button.tsx` | 5 variants 유지, KRDS 컬러 → Rausch 토큰. `font-bold leading-150` → `font-medium leading-125`, radius 6→8 |
| `src/components/ui/Input.tsx` | focus glow 제거, focus 시 border 2px 잉크로만 |
| `src/components/layout/Header.tsx` | nav 라벨 → `{typography.nav-link}` 16/600. 카테고리 dropdown 그림자 단일 토큰화 |
| `src/components/layout/Footer.tsx` | dark 컨트라스트 → 흰 면. 3-column legal band 분리 |
| Shop product card | 사진 14px corner-clip, 좌상단 배지·우상단 하트 floating 배치, 메타 4-line으로 정리 |
| 상품 상세 평점 영역 | 시그니처 56px / 700 rating-display-card 추가 |

### 8.6 적용 우선순위
1. **`globals.css` 토큰 교체** — 모든 화면에 즉시 영향, 가장 큰 ROI
2. **Header / Footer / Button** — 모든 페이지 공유 컴포넌트
3. **Shop 상품 카드 + 검색바** — 첫 화면 인상
4. **상품 상세 (rating-display-card + sourcing-order-card)** — 시그니처 모먼트
5. **마이페이지 / 주문 / 결제 플로우** — 전환 깔때기 마지막

## 9. Known Gaps

- **Hover 정밀 컬러**: 카드 hover의 elevation lift는 정의했으나, 색상 미세 변화는 `:hover` 시 `transform: translateY(-2px)` + `{shadow.float}` 만으로 처리 권장.
- **Loading / Skeleton**: 본 가이드 범위 외. 기존 `Skeleton.tsx` 재사용하되 surface는 `{colors.surface-soft}`, shimmer는 `{colors.surface-strong}` 권장.
- **다크 모드**: 정의하지 않음. 마켓플레이스 사진 충실도가 화이트 캔버스에서 가장 좋음.
- **이미지 검색 업로더 모달 전용 스타일**: 추후 별도 정의. 현재는 일반 모달 + 드래그 영역 hairline outline로 충분.
- **관리자(`/admin/*`) 페이지**: 본 가이드는 사용자 페이지에 우선 적용. 어드민은 정보 밀도가 우선이므로 일부 토큰(폰트 크기, 카드 padding)은 한 단 압축해도 무방.
