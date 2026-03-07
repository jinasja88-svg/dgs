import { NextResponse, type NextRequest } from 'next/server';
import type { SourcingProduct } from '@/types';

const MOCK_PRODUCT_DETAIL: Record<string, SourcingProduct> = {
  'mock-001': {
    product_id: 'mock-001',
    title: '고품질 무선 블루투스 이어폰 TWS',
    title_zh: '高品质无线蓝牙耳机 TWS',
    price_cny: 25.5,
    price_krw: 4718,
    images: [
      'https://cbu01.alicdn.com/img/ibank/O1CN01example1.jpg',
      'https://cbu01.alicdn.com/img/ibank/O1CN01example1b.jpg',
      'https://cbu01.alicdn.com/img/ibank/O1CN01example1c.jpg',
    ],
    skus: [
      { sku_id: 'sku-001-w', name: '화이트', price_cny: 25.5, price_krw: 4718, stock: 2000, properties: { color: '화이트' } },
      { sku_id: 'sku-001-b', name: '블랙', price_cny: 25.5, price_krw: 4718, stock: 3000, properties: { color: '블랙' } },
    ],
    seller: { name: '심천전자', rating: 4.8, years: 5, location: '广东深圳' },
    stock: 5000,
    category: '전자기기',
    min_order: 2,
  },
  'mock-002': {
    product_id: 'mock-002',
    title: '여성 캐주얼 오버사이즈 후드티',
    title_zh: '女士休闲宽松连帽衫',
    price_cny: 35.0,
    price_krw: 6475,
    images: [
      'https://cbu01.alicdn.com/img/ibank/O1CN01example2.jpg',
      'https://cbu01.alicdn.com/img/ibank/O1CN01example2b.jpg',
    ],
    skus: [
      { sku_id: 'sku-002-s', name: 'S', price_cny: 35.0, price_krw: 6475, stock: 3000, properties: { size: 'S' } },
      { sku_id: 'sku-002-m', name: 'M', price_cny: 35.0, price_krw: 6475, stock: 4000, properties: { size: 'M' } },
      { sku_id: 'sku-002-l', name: 'L', price_cny: 35.0, price_krw: 6475, stock: 3000, properties: { size: 'L' } },
    ],
    seller: { name: '광저우의류', rating: 4.6, years: 3, location: '广东广州' },
    stock: 10000,
    category: '의류/패션',
    min_order: 3,
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const product = MOCK_PRODUCT_DETAIL[id];

  if (!product) {
    return NextResponse.json(
      { error: '상품을 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}
