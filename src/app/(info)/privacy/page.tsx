import type { Metadata } from 'next';

export const metadata: Metadata = { title: '개인정보처리방침' };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-heading text-3xl font-bold text-text-primary mb-8">개인정보처리방침</h1>
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-8 text-sm text-text-secondary leading-relaxed space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">1. 수집하는 개인정보</h2>
          <p>회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>필수항목: 이메일, 이름 (소셜 로그인 시 자동 수집)</li>
            <li>선택항목: 전화번호, 배송 주소</li>
            <li>자동 수집: 접속 로그, 쿠키, IP 주소</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">2. 개인정보의 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>서비스 제공 및 운영</li>
            <li>주문 처리 및 배송</li>
            <li>고객 문의 대응</li>
            <li>서비스 개선 및 통계 분석</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">3. 개인정보의 보유 및 파기</h2>
          <p>회원 탈퇴 시 즉시 파기하며, 관련 법령에 따라 일정 기간 보관이 필요한 정보는 해당 기간 동안 보관 후 파기합니다.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">4. 문의</h2>
          <p>개인정보 관련 문의는 문의하기 페이지를 통해 연락해주세요.</p>
        </section>
      </div>
    </div>
  );
}
