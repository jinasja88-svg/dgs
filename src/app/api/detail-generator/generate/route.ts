import { NextResponse, type NextRequest } from 'next/server';
import { LLMError } from '@/lib/llm-error';
import { generate13SectionContent as generateGemini } from '@/lib/gemini';
import { generate13SectionContent as generateHF } from '@/lib/huggingface';
import { logApiCall } from '@/lib/api-logger';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { consumeDailyQuota } from '@/lib/usage-quota';

// LLM_PROVIDER=gemini 이면 Gemini, 그 외(기본값)는 HuggingFace
const generate13SectionContent =
  process.env.LLM_PROVIDER === 'gemini' ? generateGemini : generateHF;

export async function POST(request: NextRequest) {
  // 유료 LLM 호출이므로 로그인 + 사용자별 일일 한도 적용
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인 후 이용해주세요.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, title_zh, price_krw, price_cny, skus, seller, category, stock, min_order } = body;

    if (!title || !price_krw) {
      return NextResponse.json(
        { error: '상품명과 가격 정보가 필요합니다' },
        { status: 400 }
      );
    }

    if (!(await consumeDailyQuota(user.id, 'detail-generate'))) {
      return NextResponse.json({ error: '오늘 상세페이지 생성 한도를 모두 사용했습니다. 내일 다시 시도해주세요.' }, { status: 429 });
    }

    const result = await logApiCall('detail-generate', () =>
      generate13SectionContent({
        title,
        title_zh,
        price_krw,
        price_cny,
        skus: skus || [],
        seller: seller || null,
        category,
        stock,
        min_order,
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error('Detail generate error:', err);

    if (err instanceof LLMError) {
      return NextResponse.json(
        { error: `AI 생성 오류: ${err.message}` },
        { status: err.statusCode || 500 }
      );
    }

    const message = err instanceof Error ? err.message : '상세페이지 생성 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
