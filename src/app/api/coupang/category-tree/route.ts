import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import type { CatNode } from '@/lib/coupang/types';

// coupang_products 의 DISTINCT category 경로 → 4단계 중첩 트리.
// 스탠드얼론의 8.6MB wing_category_tree.json 대신 실제 데이터에서 파생 →
// 트리 path 와 상품 category prefix 가 항상 일치 (prefix mismatch 버그 없음).
export async function GET() {
  const supabase = createAdminClient();

  // category 컬럼만 대량 조회 후 JS 에서 dedupe (기본 1000행 제한 회피).
  const { data, error } = await supabase
    .from('coupang_products')
    .select('category')
    .range(0, 49999);

  if (error) {
    console.error('Coupang category-tree error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const root: CatNode[] = [];
  const byPath = new Map<string, CatNode>();
  const seen = new Set<string>();

  for (const row of data || []) {
    const raw = (row.category || '').trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);

    const parts = raw.split('>').map((s: string) => s.trim()).filter(Boolean).slice(0, 4);
    let parentChildren = root;
    let prefix = '';
    for (let depth = 1; depth <= parts.length; depth++) {
      const name = parts[depth - 1];
      prefix = prefix ? `${prefix}>${name}` : name;
      let node = byPath.get(prefix);
      if (!node) {
        node = { name, path: prefix, depth, children: [] };
        byPath.set(prefix, node);
        parentChildren.push(node);
      }
      parentChildren = node.children;
    }
  }

  // 각 레벨 이름순 정렬
  const sortRec = (nodes: CatNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(root);

  return NextResponse.json({ tree: root });
}
