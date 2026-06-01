import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useStudyStore from '../store/studyStore';
import { listConversations, deleteConversation } from '../lib/harryHistory';
import type { HarryConversation, ContextType } from '../lib/harryHistory';

const CONTEXT_LABELS: Record<ContextType, string> = {
  tbs: 'TBS', mcq: 'MCQ', sprint: '복습', concept: '개념', general: '일반',
};
const CONTEXT_COLORS: Record<ContextType, { bg: string; text: string }> = {
  tbs:     { bg: '#faf5ff', text: '#7e22ce' },
  mcq:     { bg: '#fff7ed', text: '#c2410c' },
  sprint:  { bg: '#dcfce7', text: '#166534' },
  concept: { bg: '#eff6ff', text: '#1d4ed8' },
  general: { bg: '#f1f5f9', text: '#64748b' },
};
const FILTERS: { label: string; value: ContextType | 'all' }[] = [
  { label: '전체', value: 'all' },
  { label: 'TBS', value: 'tbs' },
  { label: 'MCQ', value: 'mcq' },
  { label: '복습', value: 'sprint' },
  { label: '개념', value: 'concept' },
  { label: '일반', value: 'general' },
];

function lastPreview(conv: HarryConversation): string {
  const last = [...conv.messages].reverse().find((m) => m.role === 'assistant');
  if (!last) return '';
  return last.content.replace(/```[\s\S]*?```/g, '[SVG]').slice(0, 80);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function contextNavPath(conv: HarryConversation): string {
  if (conv.context_type === 'tbs') return '/tbs';
  if (conv.context_type === 'sprint') return '/sprint';
  if (conv.context_type === 'concept' && conv.context_id) return `/concept-notes?topic=${conv.context_id}`;
  return '/';
}

// ── Detail view ────────────────────────────────────────────────
function ConvDetail({ conv, onBack, onDelete }: {
  conv: HarryConversation;
  onBack: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const color = CONTEXT_COLORS[conv.context_type];

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border bg-white">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:bg-gray-100 font-bold">←</button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: color.bg, color: color.text }}>
              {CONTEXT_LABELS[conv.context_type]}
            </span>
            <p className="text-sm font-semibold text-[#0f172a] truncate">{conv.context_name ?? '대화'}</p>
          </div>
          <p className="text-[11px] text-muted">{fmtDate(conv.updated_at)}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => navigate(contextNavPath(conv))}
            className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-colors"
            style={{ background: '#eef2ff', color: '#3730a3' }}
          >
            이동 →
          </button>
          <button
            onClick={onDelete}
            className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-colors text-[#ef4444] hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {conv.messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#4f6ef7] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">C</div>
            )}
            <div
              className="max-w-[85%] px-3 py-2 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: '#4f6ef7', color: 'white', borderTopRightRadius: 4 }
                : { background: 'white', border: '1.5px solid #e2e8f0', borderTopLeftRadius: 4, color: '#0f172a' }
              }
            >
              {m.content.replace(/```(?:svg|html)[\s\S]*?```/g, '[SVG 시각화]')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function HarryHistoryPage() {
  const userId = useStudyStore((s) => s.userId);
  const [convs, setConvs] = useState<HarryConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ContextType | 'all'>('all');
  const [selected, setSelected] = useState<HarryConversation | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const data = await listConversations(
      userId,
      filter === 'all' ? undefined : filter,
      search || undefined,
    );
    setConvs(data);
    setLoading(false);
  }, [userId, filter, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (conv: HarryConversation) => {
    await deleteConversation(conv.id);
    setSelected(null);
    load();
  };

  if (selected) {
    return (
      <div className="h-full bg-[#f0f4f8]">
        <ConvDetail conv={selected} onBack={() => setSelected(null)} onDelete={() => handleDelete(selected)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f0f4f8]">
      {/* Header */}
      <div className="shrink-0 px-4 pt-5 pb-3">
        <h1 className="text-[17px] font-bold text-[#0f172a]">💬 Harry 히스토리</h1>
        <p className="text-[12px] text-muted mt-0.5">저장된 Harry 대화 목록</p>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-border">
          <span className="text-muted text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="대화 내용 검색..."
            className="flex-1 bg-transparent text-sm text-[#0f172a] outline-none placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted hover:text-[#0f172a] text-lg leading-none">×</button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="shrink-0 px-4 pb-3 flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold transition-colors"
            style={{
              background: filter === f.value ? '#4f6ef7' : '#f1f5f9',
              color: filter === f.value ? 'white' : '#64748b',
              border: `1.5px solid ${filter === f.value ? '#4f6ef7' : '#e2e8f0'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
        {loading && (
          <div className="text-center py-12 text-sm text-muted">불러오는 중...</div>
        )}
        {!loading && convs.length === 0 && (
          <div className="text-center py-12 text-sm text-muted">저장된 대화가 없습니다.</div>
        )}
        {convs.map((conv) => {
          const color = CONTEXT_COLORS[conv.context_type];
          const preview = lastPreview(conv);
          return (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className="w-full text-left bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: color.bg, color: color.text }}>
                    {CONTEXT_LABELS[conv.context_type]}
                  </span>
                  <p className="text-[13px] font-semibold text-[#0f172a] truncate">{conv.context_name ?? '대화'}</p>
                </div>
                <p className="text-[11px] text-muted shrink-0">{fmtDate(conv.updated_at)}</p>
              </div>
              {preview && (
                <p className="text-[12px] text-muted leading-relaxed line-clamp-2">{preview}</p>
              )}
              <p className="text-[11px] text-muted mt-1">{conv.messages.length}개 메시지 →</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
