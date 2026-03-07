import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: '딸깍소싱 - 1688 중국 소싱 대행',
    template: '%s | 딸깍소싱',
  },
  description: '원클릭으로 쉽고 투명한 1688 중국 소싱 대행 플랫폼. 12% 수수료, 실시간 환율, 배송 추적까지.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
