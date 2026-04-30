'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  type ShopFilters,
  filtersToSearchParams,
  searchParamsToFilters,
} from './filters';

interface UseShopFiltersResult {
  filters: ShopFilters;
  update: (patch: Partial<ShopFilters>) => void;
  reset: () => void;
}

export function useShopFilters(): UseShopFiltersResult {
  const router = useRouter();
  const sp = useSearchParams();

  const filters = useMemo(() => searchParamsToFilters(sp), [sp]);

  const update = useCallback(
    (patch: Partial<ShopFilters>) => {
      const next: ShopFilters = { ...filters, ...patch };
      const nextSp = filtersToSearchParams(next);
      const qs = nextSp.toString();
      router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
    },
    [filters, router]
  );

  const reset = useCallback(() => {
    router.replace('/shop', { scroll: false });
  }, [router]);

  return { filters, update, reset };
}
