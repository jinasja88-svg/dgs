import Link from 'next/link';

const footerLinks = [
  {
    title: '서비스',
    links: [
      { label: '소싱하기', href: '/shop' },
      { label: '요금 안내', href: '/pricing' },
      { label: '서비스 소개', href: '/about' },
    ],
  },
  {
    title: '고객지원',
    links: [
      { label: 'FAQ', href: '/faq' },
      { label: '문의하기', href: '/contact' },
      { label: '공지사항', href: '/notices' },
    ],
  },
  {
    title: '약관',
    links: [
      { label: '이용약관', href: '/terms' },
      { label: '개인정보처리방침', href: '/privacy' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-primary">
              딸깍소싱
            </Link>
            <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
              1688 중국 소싱 대행 플랫폼<br />
              원클릭으로 쉽고 투명한 소싱
            </p>
          </div>

          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-text-primary mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-tertiary hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <p className="text-xs text-text-tertiary text-center">
            &copy; {new Date().getFullYear()} 딸깍소싱 (OneClick Solutions). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
