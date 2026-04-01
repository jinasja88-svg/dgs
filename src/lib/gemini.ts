import type { Generated13SectionContent } from '@/types';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIMEOUT_MS = 60_000; // 13섹션 생성은 시간이 더 필요

interface GeminiResponse {
  candidates?: Array<{
    content: { parts: { text: string }[] };
  }>;
  error?: { message: string; code: number };
}

export class GeminiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'GeminiError';
  }
}

async function callGemini(
  systemPrompt: string,
  userMessage: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError('GEMINI_API_KEY is not set');

  const model = options?.model || 'gemini-2.0-flash';
  const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user' as const, parts: [{ text: userMessage }] }],
    generationConfig: {
      temperature: options?.temperature ?? 0.8,
      maxOutputTokens: options?.maxTokens ?? 4096,
      responseMimeType: 'application/json',
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new GeminiError(`Gemini API error: ${res.status} ${text}`, res.status);
    }

    const json: GeminiResponse = await res.json();
    if (json.error) {
      throw new GeminiError(`Gemini error: ${json.error.message}`, json.error.code);
    }

    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new GeminiError('Empty response from Gemini');
    return content;
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new GeminiError('Gemini request timeout', 408);
    }
    throw new GeminiError(err instanceof Error ? err.message : 'Unknown Gemini error');
  } finally {
    clearTimeout(timeout);
  }
}

// ─── 13섹션 카피 시스템 프롬프트 ───

const SYSTEM_PROMPT = `당신은 한국 이커머스 최고의 상세페이지 카피라이터입니다.
1688에서 소싱한 상품의 고전환 상세페이지(13섹션)를 작성합니다.

## 카피 원칙
1. 자연스러운 한국어 구어체 — 번역투 절대 금지
   - ❌ "당신의 라이프스타일을 향상시키세요" → ✅ "일상이 확 달라집니다"
2. 감정 → 논리 흐름 — 먼저 공감, 그 다음 설명
3. 구체적 숫자 — "많은" 대신 구체적 수치 사용
4. 짧은 문장 — 한 문장 20자 내외, 끊어 읽기 편하게
5. "중국산", "1688", "수입", "소싱" 표현 절대 사용 금지
6. 상품 데이터에 근거한 내용만 작성 — 과장 금지

## 헤드라인 공식 (택1 적용)
- 결과+기간: "[구체적 결과]를 [기간] 만에"
- 문제해결: "[문제] 없이 [원하는 결과] 얻는 법"
- 타겟+혜택: "[타겟]을 위한 [핵심 혜택]"
- 숫자강조: "[숫자]명이 선택한"
- 비교: "[기존 방법] 대신 [새로운 방법]으로"

## 공감 표현
- "혹시 이런 경험 있으신가요?"
- "그 마음 알아요"
- "당신 탓이 아닙니다"

반드시 JSON만 출력하세요.`;

// ─── 13섹션 생성 함수 ───

export async function generate13SectionContent(
  productData: {
    title: string;
    title_zh?: string;
    price_krw: number;
    price_cny: number;
    skus: { name: string; price_cny: number }[];
    seller: { name: string; rating?: number; years?: number } | null;
    category?: string;
    stock?: number;
    min_order?: number;
  }
): Promise<Generated13SectionContent> {
  const skuSummary = productData.skus.length > 0
    ? productData.skus.slice(0, 10).map(s => s.name).join(', ')
    : '단일 상품';

  const sellerInfo = productData.seller
    ? `${productData.seller.name}${productData.seller.rating ? ` (평점 ${productData.seller.rating})` : ''}${productData.seller.years ? ` ${productData.seller.years}년 운영` : ''}`
    : '정보 없음';

  const userPrompt = `다음 상품의 13섹션 상세페이지 카피를 JSON으로 생성해주세요.

## 상품 정보
- 상품명: ${productData.title}
${productData.title_zh ? `- 원본명: ${productData.title_zh}` : ''}
- 가격: ₩${productData.price_krw.toLocaleString()} (¥${productData.price_cny})
${productData.category ? `- 카테고리: ${productData.category}` : ''}
- 옵션: ${skuSummary}
- 판매자: ${sellerInfo}
${productData.stock ? `- 재고: ${productData.stock}개` : ''}
${productData.min_order ? `- 최소주문: ${productData.min_order}개` : ''}

## JSON 구조 (반드시 이 형식으로)
{
  "hero": {
    "headline_options": ["매력적 헤드라인1", "헤드라인2", "헤드라인3"],
    "subheadline": "타겟 명시 + 방법 힌트 (1문장)",
    "urgency_badge": "한정 요소 (예: 한정 수량 특가)",
    "cta_text": "CTA 버튼 텍스트"
  },
  "pain": {
    "intro": "공감 질문 (예: 혹시 이런 고민 하고 계신가요?)",
    "pain_points": ["구체적 고민1", "구체적 고민2", "구체적 고민3"],
    "emotional_hook": "감정적 마무리 (예: 혼자 고민하지 마세요)"
  },
  "problem": {
    "hook": "반전 문구 (예: 그건 당신 탓이 아닙니다)",
    "reasons": ["진짜 원인1", "진짜 원인2", "진짜 원인3"],
    "reframe": "관점 전환 문구"
  },
  "solution": {
    "intro": "이 상품 소개 도입부 (1-2문장)",
    "one_liner": "핵심 정의 한 줄",
    "target_fit": "이 상품이 딱 맞는 이유 (1-2문장)"
  },
  "how_it_works": {
    "steps": [
      {"title": "단계 제목", "description": "간단한 설명"},
      {"title": "단계 제목", "description": "간단한 설명"},
      {"title": "단계 제목", "description": "간단한 설명"}
    ]
  },
  "benefits": {
    "items": [
      {"title": "혜택 제목", "description": "혜택 설명 (1문장)"},
      {"title": "혜택 제목", "description": "혜택 설명"},
      {"title": "혜택 제목", "description": "혜택 설명"},
      {"title": "혜택 제목", "description": "혜택 설명"}
    ]
  },
  "social_proof": {
    "headline": "사회적 증거 헤드라인 (예: 이미 많은 분들이 선택했습니다)",
    "stats": ["통계1 (예: 만족도 4.8/5)", "통계2", "통계3"],
    "testimonials": [
      {"name": "김OO", "content": "후기 내용", "result": "구체적 결과"},
      {"name": "이OO", "content": "후기 내용", "result": "구체적 결과"},
      {"name": "박OO", "content": "후기 내용", "result": "구체적 결과"}
    ]
  },
  "target_filter": {
    "recommended": ["추천 대상1", "추천 대상2", "추천 대상3"],
    "not_recommended": ["비추천 대상1", "비추천 대상2"]
  },
  "faq": [
    {"question": "자주 묻는 질문1", "answer": "답변"},
    {"question": "자주 묻는 질문2", "answer": "답변"},
    {"question": "자주 묻는 질문3", "answer": "답변"}
  ],
  "final_cta": {
    "headline": "마지막 한 마디 헤드라인",
    "urgency": "긴급성 재강조",
    "cta_text": "CTA 버튼 텍스트",
    "closing": "마무리 문구 (1문장)"
  },
  "trust_text": "품질/신뢰 보증 한 문장"
}`;

  const content = await callGemini(SYSTEM_PROMPT, userPrompt, { maxTokens: 4096 });

  try {
    const p = JSON.parse(content);
    return {
      hero: {
        headline_options: Array.isArray(p.hero?.headline_options) ? p.hero.headline_options : [productData.title],
        subheadline: p.hero?.subheadline || '',
        urgency_badge: p.hero?.urgency_badge || '',
        cta_text: p.hero?.cta_text || '자세히 보기',
      },
      pain: {
        intro: p.pain?.intro || '',
        pain_points: Array.isArray(p.pain?.pain_points) ? p.pain.pain_points : [],
        emotional_hook: p.pain?.emotional_hook || '',
      },
      problem: {
        hook: p.problem?.hook || '',
        reasons: Array.isArray(p.problem?.reasons) ? p.problem.reasons : [],
        reframe: p.problem?.reframe || '',
      },
      solution: {
        intro: p.solution?.intro || '',
        one_liner: p.solution?.one_liner || '',
        target_fit: p.solution?.target_fit || '',
      },
      how_it_works: {
        steps: Array.isArray(p.how_it_works?.steps) ? p.how_it_works.steps : [],
      },
      benefits: {
        items: Array.isArray(p.benefits?.items) ? p.benefits.items : [],
      },
      social_proof: {
        headline: p.social_proof?.headline || '',
        stats: Array.isArray(p.social_proof?.stats) ? p.social_proof.stats : [],
        testimonials: Array.isArray(p.social_proof?.testimonials) ? p.social_proof.testimonials : [],
      },
      target_filter: {
        recommended: Array.isArray(p.target_filter?.recommended) ? p.target_filter.recommended : [],
        not_recommended: Array.isArray(p.target_filter?.not_recommended) ? p.target_filter.not_recommended : [],
      },
      faq: Array.isArray(p.faq) ? p.faq : [],
      final_cta: {
        headline: p.final_cta?.headline || '',
        urgency: p.final_cta?.urgency || '',
        cta_text: p.final_cta?.cta_text || '지금 주문하기',
        closing: p.final_cta?.closing || '',
      },
      trust_text: p.trust_text || '',
    };
  } catch {
    throw new GeminiError('Failed to parse Gemini response as JSON');
  }
}
