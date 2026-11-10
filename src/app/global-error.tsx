'use client';

// 루트 레이아웃 자체가 실패했을 때만 표시 — 전역 CSS/컴포넌트에 의존하지 않는다
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '96px 16px' }}>
        <h1 style={{ fontSize: 20, marginBottom: 8 }}>일시적인 오류가 발생했습니다</h1>
        <p style={{ color: '#6a6a6a', marginBottom: 24 }}>잠시 후 다시 시도해주세요.</p>
        <button
          onClick={reset}
          style={{ background: '#ff385c', color: '#fff', border: 0, borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
