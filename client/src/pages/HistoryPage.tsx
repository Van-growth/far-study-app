import { useEffect, useState } from 'react'
import useStudyStore from '../store/studyStore'
import { fetchExtractionsPage, RecentExtractionItem } from '../lib/db'

const PAGE_SIZE = 10

function fmt(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ExtractionCard({ item }: { item: RecentExtractionItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer"
      style={{ border: '1px solid #e2e8f0', background: 'white' }}
      onClick={() => setOpen((v) => !v)}
    >
      {/* Card header */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-[#4f6ef7] shrink-0">
            {item.topicId ?? '—'}
          </span>
          {item.topicTags.length > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full truncate"
              style={{ background: '#eef2ff', color: '#4338ca' }}
            >
              {item.topicTags[0]}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-[#94a3b8]">{fmt(item.createdAt)}</span>
          <span className="text-[#94a3b8] text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Collapsed preview */}
      {!open && item.concepts.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
            {item.concepts.slice(0, 4).join(' · ')}
            {item.concepts.length > 4 ? ` · +${item.concepts.length - 4}` : ''}
          </p>
        </div>
      )}

      {/* Expanded full detail */}
      {open && (
        <div
          className="px-4 pb-4 flex flex-col gap-3 border-t"
          style={{ borderColor: '#f1f5f9' }}
          onClick={(e) => e.stopPropagation()}
        >
          {item.concepts.length > 0 && (
            <div className="pt-3">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                핵심 개념
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.concepts.map((c, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: '#eef2ff', color: '#3730a3' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.ascReferences.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                ASC 참조
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.ascReferences.map((r, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.topicTags.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
                토픽 태그
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.topicTags.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fde68a' }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.trapPattern && (
            <div>
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mb-1">
                함정 패턴
              </p>
              <p className="text-xs text-[#0f172a] leading-relaxed">{item.trapPattern}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const userId = useStudyStore((s) => s.userId)
  const [items, setItems] = useState<RecentExtractionItem[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchExtractionsPage(userId, page, PAGE_SIZE).then(({ items: rows, total: cnt }) => {
      setItems(rows)
      setTotal(cnt)
      setLoading(false)
    })
  }, [userId, page])

  const totalPages = total !== null ? Math.ceil(total / PAGE_SIZE) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-lg font-bold text-[#0f172a]">분석 기록</h1>
        <p className="text-xs text-[#64748b] mt-0.5">
          {total !== null ? `총 ${total}개` : ''}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-sm text-[#64748b]">
          <div className="w-4 h-4 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
          불러오는 중…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-sm text-[#94a3b8]">
          아직 분석 기록이 없어요.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ExtractionCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && (totalPages === null ? items.length > 0 : totalPages > 1) && (
        <div className="flex items-center justify-between mt-6 px-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-40"
            style={{ background: '#f1f5f9', color: '#0f172a' }}
          >
            ← 이전
          </button>
          <span className="text-xs text-[#64748b]">
            {page + 1}{totalPages !== null ? ` / ${totalPages}` : ''} 페이지
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={items.length < PAGE_SIZE || (totalPages !== null && page + 1 >= totalPages)}
            className="text-xs px-4 py-2 rounded-lg font-medium disabled:opacity-40"
            style={{ background: '#f1f5f9', color: '#0f172a' }}
          >
            다음 10개 →
          </button>
        </div>
      )}
    </div>
  )
}
