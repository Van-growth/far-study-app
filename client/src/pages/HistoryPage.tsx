import { useEffect, useState } from 'react'
import useStudyStore from '../store/studyStore'
import { fetchExtractionsPage, updateConceptReview, RecentExtractionItem } from '../lib/db'
import { getConceptDueCount } from '../lib/db'

const PAGE_SIZE = 10

function fmt(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isDue(item: RecentExtractionItem): boolean {
  if (!item.nextReviewAt) return false
  return new Date(item.nextReviewAt) <= new Date()
}

function nextReviewLabel(item: RecentExtractionItem): string {
  if (!item.nextReviewAt) return ''
  const d = new Date(item.nextReviewAt)
  const now = new Date()
  if (d <= now) return 'DUE'
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return `${diffDays}일 후`
}

interface CardProps {
  item: RecentExtractionItem
  onReviewed: (id: string, knew: boolean) => void
}

function ExtractionCard({ item, onReviewed }: CardProps) {
  const [open, setOpen] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const due = isDue(item)

  async function handleReview(knew: boolean) {
    if (reviewing) return
    setReviewing(true)
    await updateConceptReview(item.id, knew)
    onReviewed(item.id, knew)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: due ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
        background: due ? '#fff7f7' : 'white',
      }}
    >
      {/* Card header — clickable to expand */}
      <div
        className="px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {due && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={{ background: '#ef4444', color: 'white' }}
            >
              DUE
            </span>
          )}
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
          {!due && item.nextReviewAt && (
            <span className="text-[10px] text-[#94a3b8]">{nextReviewLabel(item)}</span>
          )}
          <span className="text-[10px] text-[#94a3b8]">{fmt(item.createdAt)}</span>
          <span className="text-[#94a3b8] text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* DUE — review buttons always visible when due */}
      {due && !reviewing && (
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => void handleReview(true)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg"
            style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac' }}
          >
            ✅ 알았다
          </button>
          <button
            onClick={() => void handleReview(false)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg"
            style={{ background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' }}
          >
            🤔 헷갈려
          </button>
        </div>
      )}
      {reviewing && (
        <div className="px-4 pb-3 text-xs text-[#64748b]">저장 중…</div>
      )}

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

          {/* Review buttons in expanded view for non-due items */}
          {!due && !reviewing && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => void handleReview(true)}
                className="flex-1 text-xs font-semibold py-2 rounded-lg"
                style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
              >
                ✅ 알았다
              </button>
              <button
                onClick={() => void handleReview(false)}
                className="flex-1 text-xs font-semibold py-2 rounded-lg"
                style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fde68a' }}
              >
                🤔 헷갈려
              </button>
            </div>
          )}
          {item.reviewCount > 0 && (
            <p className="text-[10px] text-[#94a3b8]">
              복습 {item.reviewCount}회 · 간격 {item.reviewInterval}일
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const userId = useStudyStore((s) => s.userId)
  const setConceptDueCount = useStudyStore((s) => s.setConceptDueCount)
  const [items, setItems] = useState<RecentExtractionItem[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    fetchExtractionsPage(userId, page, PAGE_SIZE).then(({ items: rows, total: cnt }) => {
      // Sort: due items first within the page
      const sorted = [...rows].sort((a, b) => {
        const aDue = isDue(a) ? 0 : 1
        const bDue = isDue(b) ? 0 : 1
        return aDue - bDue
      })
      setItems(sorted)
      setTotal(cnt)
      setLoading(false)
    })
  }, [userId, page])

  function handleReviewed(id: string, _knew: boolean) {
    // Optimistically update item's nextReviewAt so it stops showing as DUE
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + 1)
        return { ...item, nextReviewAt: nextDate.toISOString(), reviewCount: item.reviewCount + 1 }
      }),
    )
    // Refresh DUE count in header
    if (userId) {
      getConceptDueCount(userId).then(setConceptDueCount)
    }
  }

  const dueCount = items.filter(isDue).length
  const totalPages = total !== null ? Math.ceil(total / PAGE_SIZE) : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#0f172a]">분석 기록</h1>
          {dueCount > 0 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: '#ef4444', color: 'white' }}
            >
              DUE {dueCount}
            </span>
          )}
        </div>
        <p className="text-xs text-[#64748b] mt-0.5">
          {total !== null ? `총 ${total}개` : ''}
          {dueCount > 0 ? ` · 오늘 복습 ${dueCount}개` : ''}
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
            <ExtractionCard key={item.id} item={item} onReviewed={handleReviewed} />
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
