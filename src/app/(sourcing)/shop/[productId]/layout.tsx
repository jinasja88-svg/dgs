import type { Metadata } from 'next';
import { getCached } from '@/lib/persistent-cache';
import { getSiteUrl } from '@/lib/site-url';
import type { SourcingProduct } from '@/types';

// 페이지는 클라이언트 컴포넌트라 메타데이터를 여기서 만든다.
// 크롤러 방문마다 유료 TMAPI를 부르지 않도록 이미 캐시된 상품만 사용한다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getCached<SourcingProduct>(`tmapi:product:${productId}`).catch(() => null);
  const url = `${getSiteUrl()}/shop/${productId}`;

  if (!product) {
    return { title: '상품 상세', alternates: { canonical: url } };
  }

  const description = `${product.title} — 1688 도매가 ${product.price_krw.toLocaleString('ko-KR')}원부터. 딸깍소싱에서 간편하게 구매대행하세요.`;
  const image = product.images?.[0];
  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.title,
      description,
      url,
      type: 'website',
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
