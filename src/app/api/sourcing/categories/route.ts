import { NextResponse } from 'next/server';
import type { SourcingCategory } from '@/types';

const categories: SourcingCategory[] = [
  { id: '1', name: '의류/패션', name_zh: '服装/时尚', icon: '👗' },
  { id: '2', name: '전자기기', name_zh: '电子产品', icon: '📱' },
  { id: '3', name: '가정/생활', name_zh: '家居/生活', icon: '🏠' },
  { id: '4', name: '뷰티/미용', name_zh: '美妆/美容', icon: '💄' },
  { id: '5', name: '식품/건강', name_zh: '食品/健康', icon: '🍎' },
  { id: '6', name: '스포츠/레저', name_zh: '运动/休闲', icon: '⚽' },
  { id: '7', name: '자동차/오토바이', name_zh: '汽车/摩托车', icon: '🚗' },
  { id: '8', name: '완구/취미', name_zh: '玩具/爱好', icon: '🎮' },
  { id: '9', name: '사무/문구', name_zh: '办公/文具', icon: '📎' },
  { id: '10', name: '반려동물', name_zh: '宠物用品', icon: '🐾' },
];

export async function GET() {
  return NextResponse.json(categories);
}
