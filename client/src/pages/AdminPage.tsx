import { useEffect, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

interface TopicCoverage {
  topic_id: string;
  label: string;
  count: number;
  trap_count: number;
  last_updated: string | null;
}

interface DashboardData {
  feedback: {
    total: number;
    ups: number;
    downs: number;
    upRate: number;
    reasonCounts: Record<string, number>;
  };
  wrongTop10: Array<{ q: string; wrong: number; total: number; wrongRate: number; moduleId: string }>;
  dau: Array<{ date: string; count: number }>;
  mau: Array<{ month: string; count: number }>;
  avgSolveSeconds: number;
  totalAnswered: number;
  becker: {
    totalExtractions: number;
    uniqueConcepts: number;
    uniqueAsc: number;
    trapPatterns: string[];
    topConcepts: Array<{ key: string; count: number }>;
    topAsc: Array<{ key: string; count: number }>;
    dailyExtractions: Array<{ date: string; count: number }>;
    updatedAt: string | null;
  };
  coverage: {
    topics: TopicCoverage[];
    gaps: string[];
  };
}

interface AdminPageProps {
  email: string;
}

interface ReclassifyResult {
  topicId: string;
  total: number;
  reclassified: number;
  details: Array<{ id: string; from: string; to: string }>;
}

export default function AdminPage({ email }: AdminPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reclassifying, setReclassifying] = useState<string | null>(null);
  const [reclassifyResult, setReclassifyResult] = useState<ReclassifyResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/admin/dashboard`, {
      headers: { 'x-user-email': email },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: DashboardData) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'load failed');
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

  const handleReclassify = async (topicId: string) => {
    setReclassifying(topicId);
    setReclassifyResult(null);
    try {
      const r = await fetch(`${API_URL}/api/admin/reclassify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': email },
        body: JSON.stringify({ topicId }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const result = await r.json();
      setReclassifyResult({ topicId, ...result });
    } catch (e) {
      setReclassifyResult({
        topicId,
        total: 0,
        reclassified: 0,
        details: [],
      });
    } finally {
      setReclassifying(null);
    }
  };

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto card p-4 text-sm text-[#991b1b]">⚠️ {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto text-sm text-muted">로딩 중...</div>
      </div>
    );
  }

  const upPct = Math.round(data.feedback.upRate * 100);

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <h1 className="text-xl font-bold text-[#0f172a]">🛠️ 어드민 대시보드</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="총 응답" value={String(data.totalAnswered)} />
          <StatCard label="평균 풀이" value={`${data.avgSolveSeconds}초`} />
          <StatCard label="👍 비율" value={`${upPct}%`} />
          <StatCard label="피드백 수" value={String(data.feedback.total)} />
        </div>

        {/* Feedback */}
        <section className="card p-4">
          <p className="font-semibold text-sm text-[#0f172a] mb-2">피드백 로그</p>
          <div className="flex gap-4 text-xs text-muted mb-3">
            <span>👍 {data.feedback.ups}</span>
            <span>👎 {data.feedback.downs}</span>
          </div>
          {Object.keys(data.feedback.reasonCounts).length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted">👎 이유</p>
              {Object.entries(data.feedback.reasonCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([r, c]) => (
                  <div key={r} className="flex justify-between text-sm">
                    <span>{r}</span>
                    <span className="font-semibold">{c}</span>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Wrong top 10 */}
        <section className="card p-4">
          <p className="font-semibold text-sm text-[#0f172a] mb-2">문제별 오답률 Top 10</p>
          <div className="flex flex-col gap-2">
            {data.wrongTop10.length === 0 && (
              <p className="text-xs text-muted">데이터가 부족합니다.</p>
            )}
            {data.wrongTop10.map((row, i) => (
              <div key={i} className="text-xs flex items-start gap-2">
                <span className="font-bold text-[#ef4444] w-10 shrink-0">
                  {Math.round(row.wrongRate * 100)}%
                </span>
                <span className="flex-1 text-[#0f172a] line-clamp-2">{row.q}</span>
                <span className="text-muted shrink-0">
                  {row.wrong}/{row.total}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* DAU */}
        <section className="card p-4">
          <p className="font-semibold text-sm text-[#0f172a] mb-2">일별 DAU (최근 30일)</p>
          <div className="flex items-end gap-1 h-24">
            {data.dau
              .slice()
              .reverse()
              .map((d) => {
                const max = Math.max(...data.dau.map((x) => x.count), 1);
                const h = Math.max(2, Math.round((d.count / max) * 88));
                return (
                  <div
                    key={d.date}
                    className="flex-1 rounded-t"
                    style={{ height: h, background: '#4f6ef7', minWidth: 3 }}
                    title={`${d.date}: ${d.count}`}
                  />
                );
              })}
          </div>
        </section>

        {/* MAU */}
        <section className="card p-4">
          <p className="font-semibold text-sm text-[#0f172a] mb-2">월별 MAU</p>
          <div className="flex flex-col gap-1">
            {data.mau.map((m) => (
              <div key={m.month} className="flex justify-between text-sm">
                <span>{m.month}</span>
                <span className="font-semibold">{m.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Becker 분석 현황 */}
        <section className="card p-4">
          <p className="font-semibold text-sm text-[#0f172a] mb-2">📘 Becker 분석 현황</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <StatCard label="총 분석" value={String(data.becker.totalExtractions)} />
            <StatCard label="누적 개념" value={String(data.becker.uniqueConcepts)} />
            <StatCard label="누적 ASC" value={String(data.becker.uniqueAsc)} />
          </div>

          <div className="mb-3">
            <p className="text-[11px] font-semibold text-muted mb-1">상위 개념</p>
            <div className="flex flex-wrap gap-1">
              {data.becker.topConcepts.slice(0, 15).map((c) => (
                <span
                  key={c.key}
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4338ca' }}
                >
                  {c.key} ×{c.count}
                </span>
              ))}
              {data.becker.topConcepts.length === 0 && (
                <span className="text-xs text-muted">아직 데이터 없음</span>
              )}
            </div>
          </div>

          {data.becker.topAsc.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-muted mb-1">상위 ASC 참조</p>
              <div className="flex flex-wrap gap-1">
                {data.becker.topAsc.slice(0, 15).map((c) => (
                  <span
                    key={c.key}
                    className="text-[11px] px-2 py-0.5 rounded-full"
                    style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534' }}
                  >
                    {c.key} ×{c.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.becker.trapPatterns.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-muted mb-1">함정 패턴</p>
              <ul className="flex flex-col gap-1">
                {data.becker.trapPatterns.slice(0, 10).map((p, i) => (
                  <li
                    key={i}
                    className="text-xs px-2 py-1 rounded"
                    style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#7f1d1d' }}
                  >
                    · {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold text-muted mb-1">일별 분석 건수 (최근 30일)</p>
            <div className="flex items-end gap-1 h-20">
              {data.becker.dailyExtractions
                .slice()
                .reverse()
                .map((d) => {
                  const max = Math.max(...data.becker.dailyExtractions.map((x) => x.count), 1);
                  const h = Math.max(2, Math.round((d.count / max) * 72));
                  return (
                    <div
                      key={d.date}
                      className="flex-1 rounded-t"
                      style={{ height: h, background: '#f59e0b', minWidth: 3 }}
                      title={`${d.date}: ${d.count}`}
                    />
                  );
                })}
              {data.becker.dailyExtractions.length === 0 && (
                <span className="text-xs text-muted">아직 데이터 없음</span>
              )}
            </div>
          </div>
        </section>
        {/* concept_extractions 커버리지 */}
        <section className="card p-4">
          <p className="font-semibold text-sm text-[#0f172a] mb-2">📊 모듈별 concept_extractions 현황</p>

          {/* 커버리지 공백 */}
          {data.coverage.gaps.length > 0 && (
            <div
              className="p-3 rounded-lg text-xs mb-3"
              style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}
            >
              ⚠️ 아직 데이터 없음 ({data.coverage.gaps.length}개 모듈):
              <div className="mt-1 leading-relaxed">{data.coverage.gaps.join(', ')}</div>
            </div>
          )}

          {/* topic_id별 테이블 */}
          {data.coverage.topics.filter((t) => t.count > 0).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="py-1.5 pr-2">모듈</th>
                    <th className="py-1.5 pr-2 text-right">건수</th>
                    <th className="py-1.5 pr-2 text-right">함정</th>
                    <th className="py-1.5 pr-2 text-right">마지막 업데이트</th>
                    <th className="py-1.5 text-right">재분류</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coverage.topics
                    .filter((t) => t.count > 0)
                    .map((t) => (
                      <tr key={t.topic_id} className="border-b border-border/50">
                        <td className="py-1.5 pr-2">
                          <span className="font-semibold">{t.topic_id}</span>
                          <span className="text-muted ml-1">{t.label}</span>
                        </td>
                        <td className="py-1.5 pr-2 text-right font-semibold">{t.count}</td>
                        <td className="py-1.5 pr-2 text-right">{t.trap_count}</td>
                        <td className="py-1.5 pr-2 text-right text-muted">
                          {t.last_updated
                            ? new Date(t.last_updated).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="py-1.5 text-right">
                          <button
                            onClick={() => handleReclassify(t.topic_id)}
                            disabled={reclassifying === t.topic_id}
                            className="px-2 py-0.5 rounded text-[10px] font-medium hover:opacity-80 disabled:opacity-40"
                            style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}
                          >
                            {reclassifying === t.topic_id ? '처리중...' : '🔄'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-muted">Supabase 연결 없음 또는 데이터 없음</p>
          )}
        </section>

        {/* 피드백 안내 */}
        {data.feedback.total === 0 && (
          <section className="card p-4">
            <p className="font-semibold text-sm text-[#0f172a] mb-1">💬 피드백 로그 안내</p>
            <p className="text-xs text-muted">
              아직 피드백 데이터가 없습니다. 퀴즈/튜터 화면에서 👍/👎 버튼을 누르면
              Supabase feedback_logs 테이블에 기록되며 여기에 표시됩니다.
            </p>
          </section>
        )}
      </div>

      {/* 재분류 결과 팝업 */}
      {reclassifyResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setReclassifyResult(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col gap-3 max-h-[80dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-sm text-[#0f172a]">
              🔄 {reclassifyResult.topicId} 재분류 결과
            </p>
            <p className="text-sm">
              <span className="font-bold text-[#4f6ef7]">{reclassifyResult.total}</span>개 중{' '}
              <span className="font-bold text-[#16a34a]">{reclassifyResult.reclassified}</span>개
              재분류 완료
            </p>
            {reclassifyResult.details.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-[11px] text-muted font-semibold">변경 내역</p>
                {reclassifyResult.details.map((d) => (
                  <div key={d.id} className="text-xs flex items-center gap-1">
                    <span className="text-[#ef4444] font-mono">{d.from}</span>
                    <span className="text-muted">→</span>
                    <span className="text-[#16a34a] font-mono">{d.to}</span>
                  </div>
                ))}
              </div>
            )}
            {reclassifyResult.reclassified === 0 && reclassifyResult.total > 0 && (
              <p className="text-xs text-muted">
                모든 데이터가 올바른 모듈에 분류되어 있습니다.
              </p>
            )}
            <button
              onClick={() => setReclassifyResult(null)}
              className="self-end px-4 py-1.5 rounded-lg text-sm font-semibold text-white mt-1"
              style={{ background: '#4f6ef7' }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="text-lg font-bold text-[#0f172a] mt-0.5">{value}</p>
    </div>
  );
}
