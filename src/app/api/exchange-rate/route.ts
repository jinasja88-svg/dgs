import { NextResponse } from 'next/server';

const FALLBACK_RATE = 185;
let cachedRate: { rate: number; fetchedAt: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
  if (cachedRate && Date.now() - cachedRate.fetchedAt < CACHE_DURATION) {
    return NextResponse.json({ rate: cachedRate.rate, cached: true });
  }

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
        return NextResponse.json({ rate: data.conversion_rate, cached: false });
      }
    }
  } catch {
    // fallback
  }

  return NextResponse.json({ rate: FALLBACK_RATE, cached: false, fallback: true });
}
