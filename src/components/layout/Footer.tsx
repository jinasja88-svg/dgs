import Link from 'next/link';

const infoLinks = [
  { label: '회사소개', href: '/about' },
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '이용안내', href: '/faq' },
];

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* 상단: 브랜드 + 링크 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
          <Link href="/" className="text-lg font-bold text-primary">
            딸깍시스터즈
          </Link>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {infoLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-text-secondary hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 중단: 사업자 정보 + 고객센터 */}
        <div className="py-6 border-b border-border space-y-4">
          {/* 쇼핑몰 기본정보 */}
          <div>
            <p className="text-[11px] font-semibold text-text-secondary mb-1.5">쇼핑몰 기본정보</p>
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              상호명 주식회사네이처발란스&nbsp;&nbsp;
              사업장 주소 58217 전라남도 나주시 상야4길 16-10 (빛가람동) 310호 네이처발란스<br />
              사업자 등록번호 792-81-03202&nbsp;&nbsp;
              통신판매업 신고번호 2024-전남나주-0193&nbsp;&nbsp;
              개인정보보호책임자 신진아
            </p>
          </div>

          {/* 고객센터 */}
          <div>
            <p className="text-[11px] font-semibold text-text-secondary mb-1.5">고객센터</p>
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              상담/주문 전화 010-8206-4656&nbsp;&nbsp;
              상담/주문 이메일&nbsp;
              <a href="mailto:jinasja88@gmail.com" className="hover:text-primary transition-colors">
                jinasja88@gmail.com
              </a>
              <br />
              CS운영시간 평일 10:00~18:00&nbsp;&nbsp;
              공식 블로그&nbsp;
              <a
                href="https://blog.naver.com/jinasja"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                blog.naver.com/jinasja
              </a>
            </p>
          </div>
        </div>

        {/* 하단: 카피라이트 */}
        <div className="pt-5 text-center">
          <p className="text-[11px] text-text-tertiary">
            Copyright © {new Date().getFullYear()} 딸깍시스터즈. All Rights Reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
