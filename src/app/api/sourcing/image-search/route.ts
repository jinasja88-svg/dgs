import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: '이미지 검색 기능은 준비 중입니다.' },
    { status: 501 }
  );
}
