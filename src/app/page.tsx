import Link from 'next/link';
import { ArrowRight, Search, Package, Truck, Shield, Zap, Globe, CreditCard } from 'lucide-react';

const steps = [
  { icon: Search, title: '상품 검색', desc: '1688에서 원하는 상품을 검색하세요' },
  { icon: Package, title: '주문 요청', desc: '상품과 수량을 선택하고 주문하세요' },
  { icon: CreditCard, title: '결제', desc: '투명한 수수료와 함께 결제하세요' },
  { icon: Truck, title: '배송 추적', desc: '실시간으로 배송 상태를 확인하세요' },
];

const features = [
  { icon: Shield, title: '투명한 수수료', desc: '12% 고정 수수료, 숨겨진 비용 없이 명확하게' },
  { icon: Globe, title: '실시간 환율', desc: 'CNY-KRW 실시간 환율로 정확한 가격 확인' },
  { icon: Zap, title: '빠른 처리', desc: '주문 접수부터 배송까지 신속하게 처리' },
  { icon: Truck, title: '배송 추적', desc: '주문 상태를 실시간으로 확인 가능' },
];

const categories = [
  { name: '의류/패션', emoji: '👗' },
  { name: '전자기기', emoji: '📱' },
  { name: '가정/생활', emoji: '🏠' },
  { name: '뷰티/미용', emoji: '💄' },
  { name: '식품/건강', emoji: '🍎' },
  { name: '스포츠/레저', emoji: '⚽' },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-light py-24 md:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in-up">
            1688 중국 소싱,<br />
            <span className="text-primary-bg">딸깍 한 번이면 끝</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-1">
            투명한 수수료 12%, 실시간 환율, 주문부터 배송까지<br className="hidden sm:block" />
            원클릭으로 간편하게 중국 상품을 소싱하세요
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary font-semibold rounded-[var(--radius-lg)] hover:shadow-lg transition-all duration-200"
            >
              소싱 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-[var(--radius-lg)] hover:bg-white/10 transition-all duration-200"
            >
              요금 안내
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              이용 방법
            </h2>
            <p className="text-text-secondary text-lg">4단계로 간편하게 소싱하세요</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-bg rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <step.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <div className="text-xs font-semibold text-primary mb-2">STEP {i + 1}</div>
                <h3 className="font-heading text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-text-tertiary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              왜 딸깍소싱인가요?
            </h2>
            <p className="text-text-secondary text-lg">차별화된 소싱 경험을 제공합니다</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-6 bg-white rounded-[var(--radius-lg)] shadow-card hover:shadow-card-hover transition-shadow duration-200"
              >
                <div className="w-12 h-12 flex-shrink-0 bg-primary-bg rounded-xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-text-tertiary">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-4">
              인기 카테고리
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center gap-3 p-6 bg-surface rounded-[var(--radius-lg)] hover:bg-primary-bg hover:shadow-md transition-all duration-200"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-sm font-medium text-text-secondary">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
            지금 바로 소싱을 시작하세요
          </h2>
          <p className="text-white/80 text-lg mb-8">
            복잡한 중국 소싱, 딸깍소싱이 대신해드립니다
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-10 py-4 bg-white text-primary font-bold rounded-[var(--radius-lg)] hover:shadow-xl transition-all duration-200 text-lg"
          >
            무료로 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
