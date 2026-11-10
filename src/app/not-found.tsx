import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary mb-4">404</p>
      <h1 className="text-xl font-bold text-ink mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-text-tertiary mb-8">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <Link
        href="/shop"
        className="inline-flex items-center justify-center px-5 py-2.5 text-[15px] font-medium bg-primary text-on-primary hover:bg-primary-active rounded-[var(--radius-sm)]"
      >
        상품 둘러보기
      </Link>
    </div>
  );
}
