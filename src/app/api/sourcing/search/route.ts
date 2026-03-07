import { NextResponse, type NextRequest } from 'next/server';
import type { SourcingProduct } from '@/types';

const MOCK_PRODUCTS: SourcingProduct[] = [
  {
    product_id: 'mock-001',
    title: '고품질 무선 블루투스 이어폰 TWS',
    title_zh: '高品质无线蓝牙耳机 TWS',
    price_cny: 25.5,
    price_krw: 4718,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example1.jpg'],
    skus: [],
    seller: { name: '심천전자', rating: 4.8, years: 5, location: '广东深圳' },
    stock: 5000,
    category: '전자기기',
    min_order: 2,
  },
  {
    product_id: 'mock-002',
    title: '여성 캐주얼 오버사이즈 후드티',
    title_zh: '女士休闲宽松连帽衫',
    price_cny: 35.0,
    price_krw: 6475,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example2.jpg'],
    skus: [],
    seller: { name: '광저우의류', rating: 4.6, years: 3, location: '广东广州' },
    stock: 10000,
    category: '의류/패션',
    min_order: 3,
  },
  {
    product_id: 'mock-003',
    title: '실리콘 주방 조리도구 세트 12종',
    title_zh: '硅胶厨房炊具套装 12件',
    price_cny: 18.8,
    price_krw: 3478,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example3.jpg'],
    skus: [],
    seller: { name: '이우주방', rating: 4.9, years: 7, location: '浙江义乌' },
    stock: 8000,
    category: '가정/생활',
    min_order: 5,
  },
  {
    product_id: 'mock-004',
    title: '비타민C 세럼 30ml 미백 에센스',
    title_zh: '维生素C精华液 30ml 美白精华',
    price_cny: 12.5,
    price_krw: 2313,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example4.jpg'],
    skus: [],
    seller: { name: '광저우뷰티', rating: 4.7, years: 4, location: '广东广州' },
    stock: 20000,
    category: '뷰티/미용',
    min_order: 10,
  },
  {
    product_id: 'mock-005',
    title: '스마트 워치 운동 건강 추적기',
    title_zh: '智能手表运动健康追踪器',
    price_cny: 68.0,
    price_krw: 12580,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example5.jpg'],
    skus: [],
    seller: { name: '심천스마트', rating: 4.5, years: 6, location: '广东深圳' },
    stock: 3000,
    category: '전자기기',
    min_order: 1,
  },
  {
    product_id: 'mock-006',
    title: '남성 캐주얼 슬림핏 청바지',
    title_zh: '男士休闲修身牛仔裤',
    price_cny: 45.0,
    price_krw: 8325,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example6.jpg'],
    skus: [],
    seller: { name: '광저우데님', rating: 4.4, years: 8, location: '广东广州' },
    stock: 15000,
    category: '의류/패션',
    min_order: 2,
  },
  {
    product_id: 'mock-007',
    title: 'LED 캠핑 랜턴 충전식 방수',
    title_zh: 'LED露营灯 充电式防水',
    price_cny: 22.0,
    price_krw: 4070,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example7.jpg'],
    skus: [],
    seller: { name: '이우아웃도어', rating: 4.8, years: 5, location: '浙江义乌' },
    stock: 6000,
    category: '스포츠/레저',
    min_order: 3,
  },
  {
    product_id: 'mock-008',
    title: '반려동물 자동 급식기 스마트',
    title_zh: '宠物自动喂食器 智能',
    price_cny: 88.0,
    price_krw: 16280,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example8.jpg'],
    skus: [],
    seller: { name: '심천펫용품', rating: 4.6, years: 3, location: '广东深圳' },
    stock: 2000,
    category: '반려동물',
    min_order: 1,
  },
  {
    product_id: 'mock-009',
    title: '미니 무선 충전기 15W 고속',
    title_zh: '迷你无线充电器 15W 快充',
    price_cny: 15.0,
    price_krw: 2775,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example9.jpg'],
    skus: [],
    seller: { name: '심천충전', rating: 4.7, years: 4, location: '广东深圳' },
    stock: 25000,
    category: '전자기기',
    min_order: 5,
  },
  {
    product_id: 'mock-010',
    title: '스테인리스 보온병 500ml 진공',
    title_zh: '不锈钢保温杯 500ml 真空',
    price_cny: 28.0,
    price_krw: 5180,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example10.jpg'],
    skus: [],
    seller: { name: '이우생활', rating: 4.9, years: 6, location: '浙江义乌' },
    stock: 12000,
    category: '가정/생활',
    min_order: 3,
  },
  {
    product_id: 'mock-011',
    title: '접이식 요가 매트 TPE 6mm',
    title_zh: '折叠瑜伽垫 TPE 6mm',
    price_cny: 32.0,
    price_krw: 5920,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example11.jpg'],
    skus: [],
    seller: { name: '이우스포츠', rating: 4.5, years: 4, location: '浙江义乌' },
    stock: 8000,
    category: '스포츠/레저',
    min_order: 2,
  },
  {
    product_id: 'mock-012',
    title: '어린이 교육용 블록 세트 200pcs',
    title_zh: '儿童教育积木套装 200件',
    price_cny: 42.0,
    price_krw: 7770,
    images: ['https://cbu01.alicdn.com/img/ibank/O1CN01example12.jpg'],
    skus: [],
    seller: { name: '산터우완구', rating: 4.8, years: 10, location: '广东汕头' },
    stock: 5000,
    category: '완구/취미',
    min_order: 2,
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get('keyword') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '12');

  let filtered = MOCK_PRODUCTS;

  if (keyword) {
    const lower = keyword.toLowerCase();
    filtered = filtered.filter(
      (p) => p.title.toLowerCase().includes(lower) || p.title_zh?.includes(keyword)
    );
  }

  if (category) {
    filtered = filtered.filter((p) => p.category === category);
  }

  const total = filtered.length;
  const start = (page - 1) * perPage;
  const data = filtered.slice(start, start + perPage);

  return NextResponse.json({
    data,
    total,
    page,
    per_page: perPage,
    total_pages: Math.ceil(total / perPage),
  });
}
