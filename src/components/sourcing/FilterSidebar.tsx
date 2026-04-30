'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Star, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FEATURE_LABELS,
  RATING_LABELS,
  REPURCHASE_LABELS,
  SHIPPING_LABELS,
  countActiveFilters,
  type ShopFeatureFilter,
  type ShopFilters,
  type ShopRatingFilter,
  type ShopRepurchaseFilter,
  type ShopShippingFilter,
} from '@/lib/sourcing/filters';
import { useDebounce } from '@/lib/hooks/use-debounce';

interface FilterSidebarProps {
  filters: ShopFilters;
  onChange: (patch: Partial<ShopFilters>) => void;
  onReset?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  resultCount?: number;
}

export default function FilterSidebar({
  filters,
  onChange,
  onReset,
  isOpen,
  onClose,
  resultCount,
}: FilterSidebarProps) {
  const isDrawer = typeof isOpen === 'boolean';
  const visible = isDrawer ? isOpen : true;
  const activeCount = countActiveFilters(filters);

  return (
    <>
      {isDrawer && visible && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          isDrawer
            ? cn(
                'fixed top-0 bottom-0 left-0 z-50 w-[85%] max-w-sm bg-canvas overflow-y-auto lg:hidden transition-transform',
                visible ? 'translate-x-0' : '-translate-x-full'
              )
            : 'hidden lg:block w-36 flex-shrink-0'
        )}
      >
        <div
          className={cn(
            isDrawer ? 'p-5' : 'bg-canvas border border-hairline rounded-[var(--radius-md)] p-3 sticky top-20'
          )}
        >
          {isDrawer ? (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-ink">필터</h2>
              <button onClick={onClose} aria-label="닫기" className="text-muted">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 mb-3">
              <h2 className="text-sm font-semibold text-ink">필터</h2>
              {activeCount > 0 && (
                <button
                  onClick={onReset}
                  className="text-[11px] text-muted hover:text-ink underline whitespace-nowrap"
                >
                  {activeCount} · 초기화
                </button>
              )}
            </div>
          )}

          <PriceSection filters={filters} onChange={onChange} />
          <Section title="배송">
            <CheckboxList<ShopShippingFilter>
              options={(['same_day', '24h', '48h'] as const).map((v) => ({
                value: v,
                label: SHIPPING_LABELS[v],
              }))}
              value={filters.shipping}
              onChange={(next) => onChange({ shipping: next })}
            />
          </Section>
          <Section title="평점">
            <RadioList<ShopRatingFilter>
              options={(['any', '4', '4.5', '5'] as const).map((v) => ({
                value: v,
                label: RATING_LABELS[v],
              }))}
              value={filters.rating}
              onChange={(next) => onChange({ rating: next })}
              renderIcon={(opt) =>
                opt.value !== 'any' ? <Star className="w-3.5 h-3.5 fill-ink text-ink" /> : null
              }
            />
          </Section>
          <Section title="재구매율">
            <RadioList<ShopRepurchaseFilter>
              options={(['any', '95', '99'] as const).map((v) => ({
                value: v,
                label: REPURCHASE_LABELS[v],
              }))}
              value={filters.repurchase}
              onChange={(next) => onChange({ repurchase: next })}
            />
          </Section>
          <Section title="상품 특성" last={!isDrawer}>
            <CheckboxList<ShopFeatureFilter>
              options={(
                [
                  'select_1688',
                  'new_7d',
                  'new_30d',
                  'return_7d',
                  'super_factory',
                  'free_shipping',
                  'plus',
                ] as const
              ).map((v) => ({ value: v, label: FEATURE_LABELS[v] }))}
              value={filters.features}
              onChange={(next) => onChange({ features: next })}
            />
          </Section>

          {isDrawer && (
            <div className="flex items-center gap-2 pt-4 border-t border-hairline-soft sticky bottom-0 bg-canvas pb-2">
              <button
                onClick={onReset}
                className="flex-1 h-11 rounded-[var(--radius-sm)] border border-ink text-ink font-medium"
              >
                초기화
              </button>
              <button
                onClick={onClose}
                className="flex-1 h-11 rounded-[var(--radius-sm)] bg-primary text-on-primary font-medium"
              >
                결과 보기{typeof resultCount === 'number' ? ` (${resultCount}개)` : ''}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ────────────────────────────── Sections ──────────────────────────────

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section className={cn('pb-3 mb-3', !last && 'border-b border-hairline-soft')}>
      <h3 className="text-[13px] font-semibold text-ink mb-2">{title}</h3>
      {children}
    </section>
  );
}

function PriceSection({
  filters,
  onChange,
}: {
  filters: ShopFilters;
  onChange: (patch: Partial<ShopFilters>) => void;
}) {
  const [minStr, setMinStr] = useState(filters.priceMin?.toString() ?? '');
  const [maxStr, setMaxStr] = useState(filters.priceMax?.toString() ?? '');

  // sync from URL → local when filters change externally
  useEffect(() => {
    setMinStr(filters.priceMin?.toString() ?? '');
    setMaxStr(filters.priceMax?.toString() ?? '');
  }, [filters.priceMin, filters.priceMax]);

  const debouncedMin = useDebounce(minStr, 400);
  const debouncedMax = useDebounce(maxStr, 400);

  // commit debounced values upward
  useEffect(() => {
    const min = debouncedMin === '' ? null : Number(debouncedMin);
    const max = debouncedMax === '' ? null : Number(debouncedMax);
    if (min === filters.priceMin && max === filters.priceMax) return;
    if ((min !== null && !Number.isFinite(min)) || (max !== null && !Number.isFinite(max))) return;
    onChange({ priceMin: min, priceMax: max });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin, debouncedMax]);

  const currencySymbol = filters.priceCurrency === 'CNY' ? '¥' : '₩';

  return (
    <Section title="가격 범위">
      <div className="flex items-center gap-1 mb-2">
        {(['KRW', 'CNY'] as const).map((cur) => (
          <button
            key={cur}
            onClick={() => onChange({ priceCurrency: cur })}
            className={cn(
              'flex-1 h-7 rounded-[var(--radius-sm)] text-[11px] font-medium transition',
              filters.priceCurrency === cur
                ? 'bg-ink text-on-primary'
                : 'bg-canvas text-ink border border-hairline hover:border-ink'
            )}
          >
            {cur === 'KRW' ? '₩' : '¥'}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center border border-hairline rounded-[var(--radius-sm)] focus-within:border-ink focus-within:border-2 px-2">
          <span className="text-xs text-muted">{currencySymbol}</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="최소"
            value={minStr}
            onChange={(e) => setMinStr(e.target.value)}
            className="w-full h-8 pl-1 text-xs bg-transparent focus:outline-none placeholder:text-muted-soft min-w-0"
          />
        </div>
        <div className="flex items-center border border-hairline rounded-[var(--radius-sm)] focus-within:border-ink focus-within:border-2 px-2">
          <span className="text-xs text-muted">{currencySymbol}</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="최대"
            value={maxStr}
            onChange={(e) => setMaxStr(e.target.value)}
            className="w-full h-8 pl-1 text-xs bg-transparent focus:outline-none placeholder:text-muted-soft min-w-0"
          />
        </div>
      </div>
    </Section>
  );
}

// ────────────────────────────── Controls ──────────────────────────────

function CheckboxList<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  const set = useMemo(() => new Set(value), [value]);

  const toggle = (v: T) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  return (
    <ul className="space-y-1.5">
      {options.map((opt) => {
        const checked = set.has(opt.value);
        return (
          <li key={opt.value}>
            <button
              type="button"
              onClick={() => toggle(opt.value)}
              className="flex items-start gap-2 text-xs text-ink hover:underline w-full leading-snug"
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 mt-0.5',
                  checked ? 'bg-ink border-ink' : 'bg-canvas border-border-strong'
                )}
              >
                {checked && <Check className="w-3 h-3 text-on-primary" strokeWidth={3} />}
              </span>
              <span className="text-left break-keep">{opt.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RadioList<T extends string>({
  options,
  value,
  onChange,
  renderIcon,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  renderIcon?: (opt: { value: T; label: string }) => React.ReactNode;
}) {
  return (
    <ul className="space-y-1.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <li key={opt.value}>
            <button
              type="button"
              onClick={() => onChange(opt.value)}
              className="flex items-center gap-2 text-xs text-ink hover:underline w-full"
            >
              <span
                className={cn(
                  'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0',
                  selected ? 'border-ink' : 'border-border-strong'
                )}
              >
                {selected && <span className="w-2 h-2 rounded-full bg-ink" />}
              </span>
              <span className="flex items-center gap-1 text-left">
                {renderIcon?.(opt)}
                {opt.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
