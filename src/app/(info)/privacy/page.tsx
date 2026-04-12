import type { Metadata } from 'next';

export const metadata: Metadata = { title: '개인정보처리방침' };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-8">개인정보처리방침</h1>
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-8 text-sm text-text-secondary leading-relaxed space-y-8">
        <p>
          주식회사네이처발란스(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를
          보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이
          개인정보 처리방침을 수립·공개합니다.
        </p>

        {/* 1. 수집하는 개인정보 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">1. 수집하는 개인정보</h2>
          <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.</p>

          <h3 className="font-medium text-text-primary mt-4 mb-2">가. 필수 수집 항목</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>이메일 주소, 이름 (소셜 로그인(Google, Kakao) 시 해당 플랫폼으로부터 자동 제공)</li>
          </ul>

          <h3 className="font-medium text-text-primary mt-4 mb-2">나. 선택 수집 항목</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>전화번호, 배송지 주소 (소싱 주문 및 배송 처리 시)</li>
          </ul>

          <h3 className="font-medium text-text-primary mt-4 mb-2">다. 결제 정보</h3>
          <p>
            신용카드 번호 등 결제 정보는 PG사(결제대행사)를 통해 처리되며, 회사는 카드번호 등 민감
            결제정보를 직접 저장하지 않습니다. 결제 처리에 필요한 최소한의 거래 식별 정보만 보유합니다.
          </p>

          <h3 className="font-medium text-text-primary mt-4 mb-2">라. 자동 수집 항목</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>IP 주소, 쿠키(Cookie), 서비스 이용 기록(접속 로그), 접속 일시</li>
            <li>기기 정보(브라우저 종류, OS 정보, 화면 해상도 등)</li>
          </ul>

          <h3 className="font-medium text-text-primary mt-4 mb-2">마. 수집 방법</h3>
          <p>
            소셜 로그인(Google, Kakao) 연동을 통한 자동 수집, 서비스 이용 과정에서 이용자의 직접 입력,
            웹사이트 접속 시 쿠키 및 로그를 통한 자동 생성·수집
          </p>
        </section>

        {/* 2. 개인정보의 이용 목적 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">2. 개인정보의 이용 목적</h2>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 이용합니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>회원 관리 및 본인 확인:</strong> 회원제 서비스 이용에 따른 본인 확인, 가입 의사 확인,
              회원자격 유지·관리, 서비스 부정 이용 방지, 각종 고지·통지 사항 전달
            </li>
            <li>
              <strong>주문 처리 및 배송:</strong> 1688 소싱 대행 주문 접수, 결제 처리, 해외 배대지 배송,
              국내 배송 등 주문 이행에 필요한 일련의 과정 수행
            </li>
            <li>
              <strong>고객 문의 및 CS 처리:</strong> 이용자의 문의 사항 및 불만 처리, 분쟁 조정을 위한
              기록 보존, 공지사항 전달
            </li>
            <li>
              <strong>서비스 개선 및 통계 분석:</strong> 서비스 이용 통계 분석, 신규 서비스 개발 및 기존
              서비스 개선을 위한 비식별화된(de-identified) 데이터 활용
            </li>
            <li>
              <strong>부정 이용 방지:</strong> 부정 가입 및 서비스 악용 방지, 비인가 접근 탐지 및 차단
            </li>
          </ul>
        </section>

        {/* 3. 개인정보의 제3자 제공 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">3. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 서비스 이행을 위해
            아래와 같이 개인정보를 제3자에게 제공할 수 있으며, 이 경우 관련 법령에 따라 필요 최소한의
            정보만 제공합니다.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-border px-3 py-2 text-left font-medium text-text-primary">제공받는 자</th>
                  <th className="border border-border px-3 py-2 text-left font-medium text-text-primary">제공 목적</th>
                  <th className="border border-border px-3 py-2 text-left font-medium text-text-primary">제공 항목</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-3 py-2">PG사 (KCP/NICE 등, PortOne 경유)</td>
                  <td className="border border-border px-3 py-2">결제 처리</td>
                  <td className="border border-border px-3 py-2">이름, 이메일, 결제정보</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">배대지 업체</td>
                  <td className="border border-border px-3 py-2">국제배송 (중국→한국)</td>
                  <td className="border border-border px-3 py-2">수령인명, 배송 주소, 연락처</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">국내 택배사</td>
                  <td className="border border-border px-3 py-2">국내배송</td>
                  <td className="border border-border px-3 py-2">수령인명, 배송 주소, 연락처</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2">
            그 외 법령에 근거가 있거나 이용자가 사전에 동의한 경우에 한하여 개인정보를 제3자에게
            제공할 수 있습니다.
          </p>
        </section>

        {/* 4. 개인정보 처리 위탁 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">4. 개인정보 처리 위탁</h2>
          <p>
            회사는 원활한 서비스 제공을 위하여 다음과 같이 개인정보 처리 업무를 외부에 위탁하고
            있으며, 위탁 계약 시 관련 법령에 따라 개인정보가 안전하게 관리될 수 있도록 필요한 사항을
            규정하고 있습니다.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-border px-3 py-2 text-left font-medium text-text-primary">수탁자</th>
                  <th className="border border-border px-3 py-2 text-left font-medium text-text-primary">위탁 업무 내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-3 py-2">Supabase (AWS ap-southeast-1)</td>
                  <td className="border border-border px-3 py-2">데이터베이스 호스팅 및 사용자 인증 처리</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">Vercel</td>
                  <td className="border border-border px-3 py-2">웹 서비스 호스팅 및 운영</td>
                </tr>
                <tr>
                  <td className="border border-border px-3 py-2">PortOne (포트원)</td>
                  <td className="border border-border px-3 py-2">전자결제 처리 대행</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. 개인정보의 보유 및 파기 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">5. 개인정보의 보유 및 파기</h2>
          <p>
            회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            회원 탈퇴 시 회원의 개인정보는 즉시 삭제됩니다. 다만, 다음의 정보에 대해서는 관련 법령에
            따라 아래의 기간 동안 보존합니다.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li>
              <strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 보관
              <span className="text-xs text-text-tertiary ml-1">(「전자상거래 등에서의 소비자보호에 관한 법률」)</span>
            </li>
            <li>
              <strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 보관
              <span className="text-xs text-text-tertiary ml-1">(「전자상거래 등에서의 소비자보호에 관한 법률」)</span>
            </li>
            <li>
              <strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 보관
              <span className="text-xs text-text-tertiary ml-1">(「전자상거래 등에서의 소비자보호에 관한 법률」)</span>
            </li>
            <li>
              <strong>웹사이트 접속 로그 기록:</strong> 3개월 보관
              <span className="text-xs text-text-tertiary ml-1">(「통신비밀보호법」)</span>
            </li>
          </ul>
          <p className="mt-3">
            파기 방법: 전자적 파일 형태의 개인정보는 기록을 재생할 수 없도록 기술적 방법을 사용하여
            안전하게 삭제하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
          </p>
        </section>

        {/* 6. 이용자의 권리 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">6. 이용자의 권리 및 행사 방법</h2>
          <p>이용자(정보주체)는 다음과 같은 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>개인정보 열람 요구권: 회사가 보유하고 있는 본인의 개인정보에 대해 열람을 요구할 수 있습니다.</li>
            <li>개인정보 정정 요구권: 개인정보에 오류가 있는 경우 정정을 요구할 수 있습니다.</li>
            <li>개인정보 삭제 요구권: 회사가 보유하고 있는 본인의 개인정보에 대해 삭제를 요구할 수 있습니다.</li>
            <li>개인정보 처리정지 요구권: 개인정보 처리의 정지를 요구할 수 있습니다.</li>
          </ul>
          <p className="mt-3">
            위 권리의 행사는 마이페이지에서 직접 수정하거나, 아래 개인정보 보호책임자에게 이메일 또는
            전화로 연락하시면 지체 없이 조치하겠습니다. 이용자가 개인정보의 오류에 대한 정정을 요청한
            경우 정정을 완료하기 전까지 해당 개인정보를 이용 또는 제공하지 않습니다. 만 14세 미만
            아동의 경우 법정대리인이 권리를 행사할 수 있습니다.
          </p>
        </section>

        {/* 7. 쿠키 및 자동수집 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">7. 쿠키(Cookie) 및 자동 수집 장치의 운영</h2>
          <h3 className="font-medium text-text-primary mt-3 mb-2">가. 쿠키의 사용 목적</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>로그인 상태 유지 및 세션 관리</li>
            <li>서비스 이용 패턴 분석을 통한 서비스 개선 및 맞춤형 서비스 제공</li>
            <li>보안 강화 및 부정 이용 탐지</li>
          </ul>
          <h3 className="font-medium text-text-primary mt-4 mb-2">나. 쿠키 설정 거부 방법</h3>
          <p>
            이용자는 웹 브라우저의 설정을 통해 쿠키의 저장을 거부하거나 삭제할 수 있습니다. 다만,
            쿠키 저장을 거부하는 경우 로그인이 필요한 일부 서비스의 이용에 제한이 있을 수 있습니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Chrome: 설정 → 개인정보 및 보안 → 쿠키 및 기타 사이트 데이터</li>
            <li>Safari: 환경설정 → 개인정보 보호 → 쿠키 및 웹사이트 데이터 관리</li>
            <li>Edge: 설정 → 쿠키 및 사이트 권한 → 쿠키 및 사이트 데이터 관리 및 삭제</li>
          </ul>
        </section>

        {/* 8. 개인정보의 안전성 확보 조치 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">8. 개인정보의 안전성 확보 조치</h2>
          <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong>전송 구간 암호화:</strong> 이용자의 개인정보는 SSL(TLS) 암호화 통신을 통해 전송되며,
              비밀번호 등 중요 정보는 암호화하여 저장·관리합니다.
            </li>
            <li>
              <strong>접근 권한 관리:</strong> 개인정보에 대한 접근 권한을 최소한의 인원으로 제한하며,
              권한 있는 관리자만이 접근할 수 있도록 접근 통제 시스템을 운영합니다.
            </li>
            <li>
              <strong>개인정보의 암호화 저장:</strong> 비밀번호, 고유식별정보 등 민감 정보는 암호화하여
              데이터베이스에 저장합니다.
            </li>
            <li>
              <strong>보안 프로그램 운영:</strong> 해킹이나 악성코드 등에 대비하여 보안 시스템을 운영하고
              주기적으로 점검합니다.
            </li>
          </ul>
        </section>

        {/* 9. 개인정보 보호책임자 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">9. 개인정보 보호책임자</h2>
          <p>
            회사는 개인정보 처리에 관한 업무를 총괄하고, 이용자의 개인정보 관련 불만 처리 및 피해 구제
            등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="mt-3 bg-gray-50 border border-border rounded-lg p-4">
            <p><strong>개인정보 보호책임자</strong></p>
            <ul className="mt-2 space-y-1">
              <li>성명: 신진아</li>
              <li>이메일: jinasja88@gmail.com</li>
              <li>연락처: 010-8206-4656</li>
            </ul>
          </div>
          <p className="mt-3">
            기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
            <li>대검찰청 사이버수사과 (spo.go.kr / 국번없이 1301)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr / 국번없이 182)</li>
          </ul>
        </section>

        {/* 10. 고지의 의무 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">10. 고지의 의무</h2>
          <p>
            본 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용의 추가, 삭제 및 수정이
            있을 수 있으며, 변경 사항은 시행 최소 7일 전에 웹사이트 공지사항을 통해 사전 고지합니다.
            다만, 이용자의 권리에 중대한 변경이 발생하는 경우에는 최소 30일 전에 고지합니다.
          </p>
        </section>

        {/* 시행일 */}
        <div className="pt-4 border-t border-border text-xs text-text-tertiary">
          <p>본 개인정보처리방침은 <strong>2026년 4월 13일</strong>부터 시행합니다.</p>
          <p className="mt-1">상호명: 주식회사네이처발란스</p>
        </div>
      </div>
    </div>
  );
}
