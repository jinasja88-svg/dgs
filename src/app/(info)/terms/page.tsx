import type { Metadata } from 'next';

export const metadata: Metadata = { title: '이용약관' };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-2">이용약관</h1>
      <p className="text-sm text-text-tertiary mb-8">시행일: 2026년 4월 13일</p>
      <div className="bg-white border border-border rounded-[var(--radius-lg)] p-8 text-sm text-text-secondary leading-relaxed space-y-8">

        {/* 제1조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제1조 (목적)</h2>
          <p>
            본 약관은 주식회사네이처발란스(이하 &quot;회사&quot;)가 운영하는 딸깍소싱 서비스(이하 &quot;서비스&quot;)를 통해 제공하는 중국 1688 플랫폼 구매대행 서비스의 이용과 관련하여, 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
          <p className="mt-2">
            회사는 직접 상품을 판매하는 소매업자가 아니며, 이용자의 요청에 따라 중국 1688 플랫폼의 상품을 대신 구매하여 배송하는 구매대행 서비스를 제공합니다. 따라서 상품의 제조, 품질, 안전성 등에 대한 직접적인 책임은 해당 상품의 원산지 판매자에게 있습니다.
          </p>
        </section>

        {/* 제2조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제2조 (정의)</h2>
          <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              <strong>&quot;서비스&quot;</strong>란 회사가 딸깍소싱 웹사이트(ddalkkak.com) 및 관련 애플리케이션을 통해 제공하는 중국 1688 플랫폼 상품 검색, 구매대행, 결제, 국제배송 등 일체의 서비스를 말합니다.
            </li>
            <li>
              <strong>&quot;이용자&quot;</strong>란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
            </li>
            <li>
              <strong>&quot;회원&quot;</strong>이란 회사에 회원가입을 하고 아이디(ID)를 부여받은 자로서, 회사가 제공하는 서비스를 지속적으로 이용할 수 있는 자를 말합니다.
            </li>
            <li>
              <strong>&quot;구매대행&quot;</strong>이란 이용자가 직접 구매하기 어려운 해외(중국 1688 플랫폼) 상품을 이용자를 대신하여 회사가 구매, 결제, 배송을 대행하는 서비스를 말합니다. 회사는 이용자의 위임에 따라 구매를 대행하며, 매매계약의 당사자는 이용자와 해외 판매자입니다.
            </li>
            <li>
              <strong>&quot;배대지(배송대행지)&quot;</strong>란 중국 내에 위치한 배송대행 창고로서, 1688 판매자로부터 발송된 상품을 수령하여 국제배송을 위해 보관 및 합포장하는 물류 거점을 말합니다.
            </li>
          </ol>
        </section>

        {/* 제3조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제3조 (서비스의 내용)</h2>
          <p>회사가 제공하는 서비스의 내용은 다음과 같습니다.</p>
          <ol className="list-decimal pl-5 space-y-2 mt-2">
            <li>
              <strong>상품 검색 서비스:</strong> 중국 1688 플랫폼의 상품을 키워드 검색 및 이미지 검색을 통해 탐색할 수 있는 기능을 제공하며, 검색 결과는 한국어로 번역되어 제공됩니다.
            </li>
            <li>
              <strong>구매대행 서비스:</strong> 이용자가 선택한 1688 상품을 회사가 대신 구매하여 한국까지 배송하는 서비스를 제공합니다.
            </li>
            <li>
              <strong>결제 서비스:</strong> PortOne(포트원) 결제 시스템을 통한 신용카드 및 체크카드 결제 서비스를 제공합니다.
            </li>
            <li>
              <strong>국제배송 및 배송추적 서비스:</strong> 중국 배대지에서 한국까지의 국제배송 및 각 배송 구간별 실시간 추적 정보를 제공합니다.
            </li>
            <li>
              <strong>실시간 환율 정보:</strong> CNY(중국 위안화)에서 KRW(한국 원화)로의 실시간 환율 정보를 제공하며, 이용자가 상품 가격을 원화로 확인할 수 있도록 합니다.
            </li>
            <li>
              <strong>고객 지원 서비스:</strong> 주문 관련 문의, 배송 추적, 반품/교환 중재 등 고객 지원 서비스를 제공합니다.
            </li>
          </ol>
        </section>

        {/* 제4조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제4조 (회원가입 및 탈퇴)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              회원가입은 소셜 로그인(Google, Kakao) 방식으로 진행되며, 이용자가 본 약관 및 개인정보처리방침에 동의한 후 회원가입이 완료됩니다.
            </li>
            <li>
              회원은 언제든지 회사에 탈퇴를 요청할 수 있으며, 회사는 즉시 회원탈퇴를 처리합니다. 다만, 다음 각 호에 해당하는 경우 탈퇴 처리가 제한될 수 있습니다.
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>진행 중인 주문(결제 완료, 구매 중, 배송 중 상태)이 있는 경우</li>
                <li>미정산 금액이 있는 경우</li>
                <li>분쟁 또는 클레임이 진행 중인 경우</li>
              </ul>
            </li>
            <li>
              회원탈퇴 시 회원의 개인정보는 개인정보처리방침에 따라 처리되며, 관계 법령에 따라 보존이 필요한 정보는 해당 기간 동안 보관 후 파기합니다.
            </li>
            <li>
              회원탈퇴 후에도 이미 완료된 주문에 대한 정보는 전자상거래 등에서의 소비자보호에 관한 법률에 따라 5년간 보관됩니다.
            </li>
          </ol>
        </section>

        {/* 제5조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제5조 (수수료 및 비용)</h2>
          <p>서비스 이용에 따른 수수료 및 비용 구조는 다음과 같습니다.</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-2">1. 구매대행 수수료</h3>
          <p className="mb-2">상품 결제 금액(원화 기준)에 따라 아래의 차등 수수료율이 적용됩니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm mt-2">
              <thead>
                <tr className="bg-bg-secondary">
                  <th className="border border-border px-4 py-2 text-left font-semibold">상품 금액 (원화 기준)</th>
                  <th className="border border-border px-4 py-2 text-left font-semibold">수수료율</th>
                  <th className="border border-border px-4 py-2 text-left font-semibold">비고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-2">~50,000원</td>
                  <td className="border border-border px-4 py-2">10%</td>
                  <td className="border border-border px-4 py-2">최소 수수료 3,000원</td>
                </tr>
                <tr className="bg-bg-secondary/50">
                  <td className="border border-border px-4 py-2">50,001원 ~ 200,000원</td>
                  <td className="border border-border px-4 py-2">8%</td>
                  <td className="border border-border px-4 py-2"></td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">200,001원 ~ 500,000원</td>
                  <td className="border border-border px-4 py-2">7%</td>
                  <td className="border border-border px-4 py-2"></td>
                </tr>
                <tr className="bg-bg-secondary/50">
                  <td className="border border-border px-4 py-2">500,001원 이상</td>
                  <td className="border border-border px-4 py-2">5%</td>
                  <td className="border border-border px-4 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="font-semibold text-text-primary mt-4 mb-2">2. 환율</h3>
          <p>
            상품 가격은 실시간 CNY/KRW 환율을 기반으로 원화로 환산되며, 회사는 환율 마진을 일체 부과하지 않습니다(환율 마진 0%). 표시되는 환율은 주문 시점의 실시간 환율이 적용됩니다.
          </p>

          <h3 className="font-semibold text-text-primary mt-4 mb-2">3. 국제배송비</h3>
          <p className="mb-2">국제배송비는 실제 중량을 기준으로 아래와 같이 부과됩니다. 배송비는 물류 파트너사의 요금 변동에 따라 변경될 수 있습니다.</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border text-sm mt-2">
              <thead>
                <tr className="bg-bg-secondary">
                  <th className="border border-border px-4 py-2 text-left font-semibold">중량 구간</th>
                  <th className="border border-border px-4 py-2 text-left font-semibold">배송비</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-border px-4 py-2">~1kg</td>
                  <td className="border border-border px-4 py-2">9,000원</td>
                </tr>
                <tr className="bg-bg-secondary/50">
                  <td className="border border-border px-4 py-2">1kg 초과 ~ 3kg</td>
                  <td className="border border-border px-4 py-2">13,000원</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">3kg 초과 ~ 5kg</td>
                  <td className="border border-border px-4 py-2">16,000원</td>
                </tr>
                <tr className="bg-bg-secondary/50">
                  <td className="border border-border px-4 py-2">5kg 초과 ~ 10kg</td>
                  <td className="border border-border px-4 py-2">22,000원</td>
                </tr>
                <tr>
                  <td className="border border-border px-4 py-2">10kg 초과 ~ 20kg</td>
                  <td className="border border-border px-4 py-2">35,000원</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-text-tertiary">※ 부피 중량이 실중량보다 큰 경우 부피 중량이 적용될 수 있습니다.</p>

          <h3 className="font-semibold text-text-primary mt-4 mb-2">4. 관세 및 부가가치세</h3>
          <p>
            물품 가격이 미화 $150를 초과하는 경우 관세(8~13%, 품목에 따라 상이) 및 부가가치세(10%)가 부과되며, 이는 이용자가 부담합니다. 통관을 위해 이용자의 개인통관고유부호가 반드시 필요하며, 주문 시 정확한 개인통관고유부호를 입력하여야 합니다. 개인통관고유부호는 관세청 홈페이지(unipass.customs.go.kr)에서 발급받을 수 있습니다.
          </p>
        </section>

        {/* 제6조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제6조 (주문 및 결제)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              이용자는 서비스를 통해 원하는 상품을 장바구니에 담고, 배송지 정보를 입력한 후, 결제를 진행하여 구매대행을 신청할 수 있습니다. 주문 절차는 &quot;상품 선택 → 장바구니 → 배송지 입력 → 결제&quot;의 순서로 진행됩니다.
            </li>
            <li>
              결제는 PortOne(포트원) 결제 시스템을 통한 신용카드 및 체크카드로 가능하며, 결제 완료 시점에 주문이 확정됩니다.
            </li>
            <li>
              결제 금액에는 상품 가격(원화 환산), 구매대행 수수료, 국제배송비가 포함됩니다. 관세 및 부가가치세는 통관 시 별도로 부과될 수 있습니다.
            </li>
            <li>
              결제가 완료되지 않은 주문은 주문 생성 시점으로부터 30분 후 자동으로 취소됩니다.
            </li>
            <li>
              회사는 주문 접수 후 합리적인 기간 내에 1688 플랫폼에서 해당 상품의 구매를 진행합니다. 다만, 품절, 가격 변동, 판매자 사정 등으로 구매가 불가능한 경우 이용자에게 즉시 통보하고 전액 환불합니다.
            </li>
          </ol>
        </section>

        {/* 제7조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제7조 (주문 취소 및 청약철회)</h2>
          <p className="mb-2">주문 상태에 따른 취소 및 청약철회 가능 여부는 다음과 같습니다.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>결제 전(pending 상태):</strong> 이용자는 자유롭게 주문을 취소할 수 있으며, 별도의 수수료가 부과되지 않습니다.
            </li>
            <li>
              <strong>결제 완료, 1688 구매 전(paid 상태):</strong> 이용자는 주문 취소를 요청할 수 있으며, 결제 금액 전액이 환불됩니다.
            </li>
            <li>
              <strong>1688 구매 진행 중(purchasing 상태):</strong> 해외 판매자에게 이미 주문이 접수된 상태이므로 원칙적으로 취소가 불가능합니다. 다만, 회사의 귀책사유(잘못된 상품 주문, 주문 누락 등)로 인한 경우에는 예외적으로 취소 및 환불이 가능합니다.
            </li>
            <li>
              <strong>배송 중(shipping 상태):</strong> 상품이 이미 발송된 상태이므로 취소가 불가능합니다.
            </li>
            <li>
              <strong>배송 완료(delivered 상태):</strong> 취소가 불가능하며, 제9조에 따른 반품 및 교환 절차를 통해 처리됩니다.
            </li>
          </ol>
          <p className="mt-3">
            본 서비스는 전자상거래 등에서의 소비자보호에 관한 법률 제17조 제2항에 따른 해외 구매대행 서비스로서, 이용자의 주문에 의해 개별적으로 해외에서 구매가 이루어지므로 단순 변심에 의한 청약철회가 제한될 수 있습니다. 회사는 이 사실을 주문 시 이용자에게 명확히 고지합니다.
          </p>
        </section>

        {/* 제8조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제8조 (환불)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              환불은 결제 취소일로부터 3~7 영업일 이내에 원래의 결제 수단으로 처리됩니다. 카드사 사정에 따라 환불 처리 기간이 상이할 수 있습니다.
            </li>
            <li>
              주문 내 일부 상품에 대해서만 환불이 필요한 경우, 해당 상품에 대한 부분 환불이 가능합니다.
            </li>
            <li>
              1688 판매자에게 구매가 완료된 이후(purchasing 상태 이후)에는 이용자의 단순 변심에 의한 환불이 불가능합니다.
            </li>
            <li>
              구매대행 수수료는 1688 구매가 진행되기 전(paid 상태)에 취소된 경우에만 환불됩니다. 구매가 진행된 이후에는 이미 대행 서비스가 이행된 것으로 보아 수수료를 환불하지 않습니다.
            </li>
            <li>
              회사의 귀책사유로 인한 취소의 경우, 결제 금액 전액(수수료 포함)을 환불합니다.
            </li>
          </ol>
        </section>

        {/* 제9조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제9조 (반품 및 교환)</h2>
          <p className="mb-2">배송 완료(delivered) 상태의 주문에 한하여 다음과 같이 반품 및 교환이 가능합니다.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>불량, 파손, 오배송의 경우:</strong> 상품 수령일로부터 7일 이내에 회사에 신고하여야 하며, 이 경우 교환 또는 환불 처리됩니다. 반품에 소요되는 배송비는 회사가 부담합니다. 불량 및 파손의 입증을 위해 이용자는 상품 사진 등 증거자료를 제출하여야 합니다.
            </li>
            <li>
              <strong>이용자의 단순 변심의 경우:</strong> 반품은 가능하나, 국제 반품배송비(중국까지의 배송비)를 포함한 왕복 배송비를 이용자가 부담합니다.
            </li>
            <li>
              <strong>상품 불일치(주문 상품과 다른 상품 수령)의 경우:</strong> 회사가 1688 판매자와 중재하여 교환 또는 환불을 진행합니다.
            </li>
            <li>
              다음 각 호에 해당하는 경우에는 반품 및 교환이 불가능합니다.
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>이용자의 사용 또는 일부 소비에 의하여 상품의 가치가 현저히 감소한 경우</li>
                <li>이용자의 귀책사유로 상품이 훼손된 경우</li>
                <li>시간의 경과로 재판매가 불가능할 정도로 상품의 가치가 감소한 경우</li>
                <li>복제가 가능한 상품(디지털 콘텐츠 등)의 포장을 훼손한 경우</li>
              </ul>
            </li>
            <li>
              국제 반품의 특성상 반품 시 추가적인 국제배송비 및 통관 비용이 발생할 수 있으며, 이는 반품 사유에 따라 회사 또는 이용자가 부담합니다.
            </li>
          </ol>
        </section>

        {/* 제10조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제10조 (배송)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              배송은 다음의 3단계로 진행됩니다.
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong>1단계 (중국 국내배송):</strong> 1688 판매자로부터 중국 내 배대지(배송대행 창고)까지의 배송</li>
                <li><strong>2단계 (국제배송):</strong> 중국 배대지에서 한국까지의 국제배송</li>
                <li><strong>3단계 (한국 국내배송):</strong> 통관 완료 후 이용자의 배송지까지의 국내배송</li>
              </ul>
            </li>
            <li>
              주문 확정일로부터 배송 완료까지 통상 7~15 영업일이 소요됩니다. 다만, 다음 각 호의 사유로 배송이 지연될 수 있으며, 이 경우 회사는 이용자에게 지연 사유를 즉시 통보합니다.
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>통관 지연 (세관 검사, 서류 보완 등)</li>
                <li>중국 공휴일 및 연휴 (춘절, 국경절 등)</li>
                <li>판매자의 재고 부족 또는 발송 지연</li>
                <li>천재지변, 전염병, 국제 물류 혼잡 등 불가항력적 사유</li>
              </ul>
            </li>
            <li>
              회사는 각 배송 구간별로 배송추적 정보를 제공하며, 이용자는 마이페이지에서 실시간으로 배송 상태를 확인할 수 있습니다.
            </li>
            <li>
              배송 과정에서 상품이 분실 또는 파손된 경우, 회사가 해당 손해에 대하여 책임을 지며 환불 또는 재발송 처리합니다.
            </li>
          </ol>
        </section>

        {/* 제11조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제11조 (서비스 이용 제한)</h2>
          <p className="mb-2">회사는 다음 각 호에 해당하는 행위를 하는 이용자에 대하여 서비스 이용을 제한하거나 회원자격을 박탈할 수 있습니다.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>타인의 명의, 결제 정보, 개인통관고유부호를 도용하여 주문하는 행위</li>
            <li>허위의 정보를 기재하거나 회사가 요청하는 정보를 제공하지 않는 행위</li>
            <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위를 하는 경우</li>
            <li>회사의 서비스 운영을 방해하거나 시스템에 부정 접근하는 행위</li>
            <li>다른 이용자의 개인정보를 수집하거나 서비스를 상업적으로 악용하는 행위</li>
            <li>관세법 등 관련 법령을 위반하는 물품의 구매를 요청하는 행위</li>
          </ol>
          <p className="mt-3">
            다음의 물품은 대한민국 관세법 및 관련 법령에 의해 수입이 금지되어 있으므로 구매대행이 불가합니다: 마약류, 총기·도검류, 위조화폐, 지적재산권 침해 물품(위조 브랜드 상품 등), 음란물, 식품위생법에 위반되는 식품류, 의약품(의사 처방전 없는 경우), 멸종위기 동식물 관련 제품, 기타 대한민국 법률에 의해 수입이 금지·제한된 물품.
          </p>
        </section>

        {/* 제12조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제12조 (면책)</h2>
          <p className="mb-2">회사는 다음 각 호의 사항에 대하여 직접적인 책임을 부담하지 않습니다. 다만, 회사는 이용자의 피해를 최소화하기 위하여 성실히 중재 및 지원합니다.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>상품 품질:</strong> 1688 판매자가 제공하는 상품의 품질, 사양, 안전성에 대한 직접적인 책임. 회사는 구매대행자로서 상품을 직접 제조하거나 판매하지 않으나, 불량 및 하자 발생 시 판매자와의 중재를 성실히 수행합니다.
            </li>
            <li>
              <strong>환율 변동:</strong> 주문 시점과 실제 결제 시점 간의 환율 변동으로 인한 가격 차이. 회사는 실시간 환율을 제공하기 위해 최선을 다하나, 환율 변동의 위험은 이용자에게 있습니다.
            </li>
            <li>
              <strong>관세 및 세금:</strong> 통관 과정에서 부과되는 관세, 부가가치세, 기타 세금. 이는 대한민국 세관 당국의 판단에 따르며, 이용자가 부담합니다.
            </li>
            <li>
              <strong>불가항력:</strong> 천재지변, 전쟁, 테러, 전염병, 정부의 조치, 파업 등 불가항력적 사유로 인한 서비스 제공의 지연 또는 불이행.
            </li>
            <li>
              <strong>1688 플랫폼 장애:</strong> 1688 플랫폼의 시스템 장애, 서버 점검, 정책 변경 등으로 인한 서비스 일시 중단 또는 검색 결과의 변동.
            </li>
          </ol>
        </section>

        {/* 제13조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제13조 (지적재산권)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              서비스에 포함된 UI/UX 디자인, 로고, 서비스명(&quot;딸깍소싱&quot;), 소프트웨어, 텍스트, 이미지 등 일체의 콘텐츠에 대한 지적재산권은 회사에 귀속됩니다.
            </li>
            <li>
              서비스를 통해 표시되는 1688 상품의 이미지, 상품 설명, 판매자 정보 등은 해당 상품의 원산지 판매자 또는 1688 플랫폼에 귀속되며, 회사는 구매대행 서비스 제공 목적으로만 해당 정보를 이용합니다.
            </li>
            <li>
              이용자는 회사의 사전 서면 동의 없이 서비스의 콘텐츠를 복제, 배포, 방송, 수정, 2차 저작물 작성 등에 이용할 수 없습니다.
            </li>
          </ol>
        </section>

        {/* 제14조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제14조 (분쟁 해결)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              회사와 이용자 간에 서비스 이용과 관련하여 분쟁이 발생한 경우, 양 당사자는 분쟁의 원만한 해결을 위하여 성실히 협의합니다.
            </li>
            <li>
              제1항의 협의에도 불구하고 분쟁이 해결되지 않는 경우, 이용자는 한국소비자원 또는 전자거래분쟁조정위원회에 조정을 신청할 수 있습니다.
            </li>
            <li>
              제1항 및 제2항에 따른 절차에도 불구하고 분쟁이 해결되지 않는 경우, 회사의 본사 소재지를 관할하는 법원(전라남도 나주시 관할 법원)을 전속 관할 법원으로 합니다.
            </li>
            <li>
              본 약관의 해석 및 적용에 관하여는 대한민국 법률을 준거법으로 합니다.
            </li>
          </ol>
        </section>

        {/* 제15조 */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">제15조 (약관의 변경)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              회사는 관련 법령에 위배되지 않는 범위 내에서 본 약관을 변경할 수 있습니다.
            </li>
            <li>
              약관을 변경하는 경우, 변경 내용 및 적용일을 명시하여 적용일 7일 전부터 서비스 내 공지사항을 통해 공지합니다. 다만, 이용자에게 불리한 내용으로 변경하는 경우에는 적용일 30일 전부터 공지하며, 이메일 등 개별 통지를 병행합니다.
            </li>
            <li>
              이용자는 변경된 약관에 동의하지 않는 경우 회원탈퇴를 요청할 수 있습니다. 변경된 약관의 효력 발생일 이후에도 서비스를 계속 이용하는 경우, 변경된 약관에 동의한 것으로 간주합니다.
            </li>
          </ol>
        </section>

        {/* 부칙 */}
        <section className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-text-primary mb-3">부칙</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>본 약관은 2026년 4월 13일부터 시행합니다.</li>
            <li>본 약관 시행 이전에 가입한 회원에게도 본 약관이 적용됩니다.</li>
          </ol>
        </section>

        {/* 사업자 정보 */}
        <section className="border-t border-border pt-6 text-xs text-text-tertiary space-y-1">
          <p><strong>상호명:</strong> 주식회사네이처발란스</p>
          <p><strong>사업자 등록번호:</strong> 792-81-03202</p>
          <p><strong>통신판매업 신고번호:</strong> 2024-전남나주-0193</p>
          <p><strong>개인정보보호책임자:</strong> 신진아</p>
          <p><strong>주소:</strong> 58217 전라남도 나주시 상야4길 16-10 (빛가람동) 310호</p>
        </section>

      </div>
    </div>
  );
}
