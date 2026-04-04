'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

type Period = 'today' | '7d' | '30d';

interface Log {
  endpoint: string;
  duration_ms: number | null;
  success: boolean;
  error_msg: string | null;
  created_at: string;
}

interface EndpointStat {
  endpoint: string;
  count: number;
  errorCount: number;
  avgMs: number;
}

const ENDPOINT_LABELS: Record<string, string> = {
  search: '키워드 검색',
  'image-search': '이미지 검색',
  product: '상품 상세',
};

const PERIOD_LABELS: Record<Period, string> = { today: '오늘', '7d': '최근 7일', '30d': '최근 30일' };

export default function ApiMonitorPage() {
  const [period, setPeriod] = useState<Period>('today');
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getStartDate = (p: Period): string => {
    const d = new Date();
    if (p === 'today') { d.setHours(0, 0, 0, 0); return d.toISOString(); }
    if (p === '7d') { d.setDate(d.getDate() - 7); return d.toISOString(); }
    d.setDate(d.getDate() - 30);
    return d.toISOString();
  };

  const load = async (p: Period) => {
    setIsLoading(true);
    const since = getStartDate(p);
    const res = await fetch(`/api/admin/api-logs?since=${encodeURIComponent(since)}`);
    const json = await res.json();
    setLogs((json.data || []) as Log[]);
    setIsLoading(false);
  };

  useEffect(() => { load(period); }, [period]);

  const total = logs.length;
  const errorCount = logs.filter((l) => !l.success).length;
  const successCount = total - errorCount;
  const avgMs = total > 0 ? Math.round(logs.reduce((s, l) => s + (l.duration_ms || 0), 0) / total) : 0;
  const errorRate = total > 0 ? ((errorCount / total) * 100).toFixed(1) : '0.0';

  const epStats: EndpointStat[] = Object.entries(
    logs.reduce<Record<string, Log[]>>((acc, l) => {
      acc[l.endpoint] = acc[l.endpoint] || [];
      acc[l.endpoint].push(l);
      return acc;
    }, {})
  ).map(([endpoint, epLogs]) => ({
    endpoint,
    count: epLogs.length,
    errorCount: epLogs.filter((l) => !l.success).length,
    avgMs: Math.round(epLogs.reduce((s, l) => s + (l.duration_ms || 0), 0) / epLogs.length),
  }));

  const errorLogs = logs.filter((l) => !l.success).slice(0, 20);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">API 모니터링</h1>
        <button
          onClick={() => load(period)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> 새로고침
        </button>
      </div>

      {/* 기간 필터 */}
      <div className="flex gap-1 p-1 bg-surface rounded-[var(--radius-lg)] w-fit">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-sm rounded-[var(--radius-md)] font-medium transition-colors ${
              period === p ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Activity, label: '총 호출', value: `${total}회`, color: 'text-primary bg-primary-5' },
          { icon: CheckCircle, label: '성공', value: `${successCount}회`, color: 'text-success bg-success/10' },
          { icon: AlertCircle, label: '에러', value: `${errorCount}건 (${errorRate}%)`, color: errorCount > 0 ? 'text-danger bg-danger/10' : 'text-text-tertiary bg-surface' },
          { icon: Clock, label: '평균 응답시간', value: total ? `${avgMs}ms` : '-', color: avgMs > 3000 ? 'text-warning bg-warning/10' : 'text-text-secondary bg-surface' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <span className="text-xs text-text-tertiary">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      {/* 엔드포인트별 통계 */}
      <div className="bg-white rounded-[var(--radius-lg)] p-5 shadow-card">
        <h2 className="text-sm font-semibold text-text-primary mb-4">엔드포인트별 통계</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-surface rounded-[var(--radius-md)] animate-pulse" />)}
          </div>
        ) : epStats.length === 0 ? (
          <p className="text-sm text-text-tertiary text-center py-8">호출 기록 없음</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {epStats.map((ep) => {
              const pct = total > 0 ? Math.round((ep.count / total) * 100) : 0;
              const errRate = ep.count > 0 ? ((ep.errorCount / ep.count) * 100).toFixed(1) : '0.0';
              return (
                <div key={ep.endpoint} className="bg-surface rounded-[var(--radius-lg)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-text-primary">
                      {ENDPOINT_LABELS[ep.endpoint] || ep.endpoint}
                    </span>
                    <span className="text-xs text-text-tertiary">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-border-light rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-base font-bold text-text-primary">{ep.count}</p>
                      <p className="text-[10px] text-text-tertiary">호출</p>
                    </div>
                    <div>
                      <p className={`text-base font-bold ${ep.errorCount > 0 ? 'text-danger' : 'text-text-primary'}`}>{ep.errorCount}</p>
                      <p className="text-[10px] text-text-tertiary">에러</p>
                    </div>
                    <div>
                      <p className={`text-base font-bold ${ep.avgMs > 3000 ? 'text-warning' : 'text-text-primary'}`}>{ep.avgMs}ms</p>
                      <p className="text-[10px] text-text-tertiary">평균</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 에러 로그 */}
      <div className="bg-white rounded-[var(--radius-lg)] shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border-light">
          <h2 className="text-sm font-semibold text-text-primary">
            에러 로그
            {errorLogs.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-danger/10 text-danger text-xs rounded-full">{errorLogs.length}</span>
            )}
          </h2>
        </div>
        {errorLogs.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-sm text-text-tertiary">에러 없음</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {['시각', '엔드포인트', '응답시간', '에러 내용'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium text-text-tertiary">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {errorLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-surface/50">
                    <td className="px-4 py-3 text-text-tertiary whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-danger/10 text-danger text-xs rounded-full">
                        {ENDPOINT_LABELS[log.endpoint] || log.endpoint}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{log.duration_ms != null ? `${log.duration_ms}ms` : '-'}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-xs truncate">{log.error_msg || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
