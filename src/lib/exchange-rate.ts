const FALLBACK_RATE = 208;
let cachedRate: { rate: number; fetchedAt: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getExchangeRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_DURATION) {
    return cachedRate.rate;
  }

  // 1) Paid API
  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (apiKey) {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/pair/CNY/KRW`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      if (data.conversion_rate) {
        cachedRate = { rate: data.conversion_rate, fetchedAt: Date.now() };
        return data.conversion_rate;
      }
    }
  } catch {
    // try free API
  }

  // 2) Free API
  try {
    const res = await fetch(
      'https://open.er-api.com/v6/latest/CNY',
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data.result === 'success' && data.rates?.KRW) {
      const rate = Math.round(data.rates.KRW * 100) / 100;
      cachedRate = { rate, fetchedAt: Date.now() };
      return rate;
    }
  } catch {
    // fallback
  }

  return FALLBACK_RATE;
}
