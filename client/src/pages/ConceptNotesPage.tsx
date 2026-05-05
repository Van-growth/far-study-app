import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { DB } from '../constants/db'
import useStudyStore from '../store/studyStore'

interface TopicRow {
  topicId: string
  topicName: string
  rule: string | null
  trap: string | null
  example: string | null
  triggerKeywords: string[] | null
}

async function loadTopics(): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from(DB.TABLES.TOPICS)
    .select('topic_id, topic_name, rule, trap, example, trigger_keywords')
    .eq('exam_section', 'FAR')
    .order('topic_id')
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(r => ({
    topicId: String(r.topic_id ?? ''),
    topicName: String(r.topic_name ?? ''),
    rule: r.rule ? String(r.rule) : null,
    trap: r.trap ? String(r.trap) : null,
    example: r.example ? String(r.example) : null,
    triggerKeywords: Array.isArray(r.trigger_keywords)
      ? (r.trigger_keywords as unknown[]).map(String)
      : null,
  }))
}

async function saveReviewLog(userId: string, topicId: string, result: 'known' | 'confused') {
  await supabase.from(DB.TABLES.REVIEW_LOG).insert({
    user_id: userId,
    topic_id: topicId,
    concept_id: null,
    result,
    reviewed_at: new Date().toISOString(),
  })
}

function categoryOf(topicId: string): string {
  return topicId.split('_')[0]
}

export default function ConceptNotesPage() {
  const userId = useStudyStore((s) => s.userId)
  const [topics, setTopics] = useState<TopicRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTopics().then(data => {
      setTopics(data)
      setLoading(false)
    })
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(topics.map(t => categoryOf(t.topicId)))
    return ['All', ...Array.from(cats).sort()]
  }, [topics])

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return topics
    return topics.filter(t => categoryOf(t.topicId) === activeCategory)
  }, [topics, activeCategory])

  const topic = filtered[index] ?? null

  const handleCategory = (cat: string) => {
    setActiveCategory(cat)
    setIndex(0)
    setRevealed(false)
  }

  const nextCard = () => {
    setIndex(i => Math.min(filtered.length - 1, i + 1))
    setRevealed(false)
  }

  const handleResult = async (result: 'known' | 'confused') => {
    if (!userId || !topic || saving) return
    setSaving(true)
    await saveReviewLog(userId, topic.topicId, result)
    setSaving(false)
    nextCard()
  }

  const progress = filtered.length > 0 ? (index + 1) / filtered.length : 0
  const isLast = index >= filtered.length - 1

  if (loading) {
    return (
      <div style={{ height: 'calc(100dvh - 98px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>불러오는 중...</p>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100dvh - 98px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f4f8' }}>

      {/* Category filter tabs */}
      <div style={{ flexShrink: 0, background: 'white', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', width: 'max-content' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              style={{
                padding: '5px 14px',
                borderRadius: 20,
                border: 'none',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: activeCategory === cat ? '#4f6ef7' : '#f1f5f9',
                color: activeCategory === cat ? 'white' : '#475569',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Progress bar + counter */}
      <div style={{ flexShrink: 0, padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
            {index + 1} / {filtered.length}
          </span>
          {topic && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              padding: '3px 9px', borderRadius: 7,
              background: '#eef2ff', color: '#4f6ef7',
              letterSpacing: '0.03em',
            }}>
              {topic.topicId}
            </span>
          )}
        </div>
        <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: '#4f6ef7', borderRadius: 3,
            width: `${progress * 100}%`, transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Card scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {!topic ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>항목 없음</p>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: 20,
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}>
            {/* Topic name */}
            <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.3, margin: 0 }}>
              {topic.topicName}
            </p>

            {/* TRIGGER keywords */}
            <div style={{ textAlign: 'center', padding: '14px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, margin: '0 0 10px' }}>
                Trigger Keywords
              </p>
              {topic.triggerKeywords && topic.triggerKeywords.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {topic.triggerKeywords.map((kw, i) => (
                    <span key={i} style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: '#4f6ef7',
                      background: '#eef2ff',
                      borderRadius: 10,
                      padding: '7px 14px',
                    }}>
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', margin: 0 }}>—</p>
              )}
            </div>

            {/* Reveal button */}
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                style={{
                  background: '#4f6ef7',
                  color: 'white',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px 0',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                RULE 확인하기 →
              </button>
            )}

            {/* Revealed content */}
            {revealed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {topic.rule && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 14 }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>RULE</p>
                    <p style={{ fontSize: '0.8rem', color: '#065f46', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{topic.rule}</p>
                  </div>
                )}
                {topic.trap && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: 14 }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>TRAP ⚠️</p>
                    <p style={{ fontSize: '0.8rem', color: '#7f1d1d', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{topic.trap}</p>
                  </div>
                )}
                {topic.example && (
                  <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 14, padding: 14 }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>EXAMPLE</p>
                    <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{topic.example}</p>
                  </div>
                )}
                {!isLast && (
                  <button
                    onClick={nextCard}
                    style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      border: 'none',
                      borderRadius: 12,
                      padding: '11px 0',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: 2,
                    }}
                  >
                    다음 →
                  </button>
                )}
                {isLast && (
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4f6ef7', margin: 0 }}>
                      🎉 모든 카드 완료!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom: ✕ 몰라 | ✓ 알아 */}
      <div style={{ flexShrink: 0, padding: '8px 16px 16px', display: 'flex', gap: 10 }}>
        <button
          onClick={() => handleResult('confused')}
          disabled={!topic || saving}
          style={{
            flex: 1,
            padding: '16px 0',
            borderRadius: 16,
            border: '2px solid #fca5a5',
            background: '#fef2f2',
            color: '#dc2626',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: !topic || saving ? 'default' : 'pointer',
            opacity: !topic || saving ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          ✕ 몰라
        </button>
        <button
          onClick={() => handleResult('known')}
          disabled={!topic || saving}
          style={{
            flex: 1,
            padding: '16px 0',
            borderRadius: 16,
            border: '2px solid #86efac',
            background: '#f0fdf4',
            color: '#16a34a',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: !topic || saving ? 'default' : 'pointer',
            opacity: !topic || saving ? 0.5 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          ✓ 알아
        </button>
      </div>
    </div>
  )
}
