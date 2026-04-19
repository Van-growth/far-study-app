import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import {
  getErrorPatterns,
  tagAttemptError,
  ErrorPattern,
} from '../../lib/db'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

const CATEGORIES = [
  { label: '개념 미이해', emoji: '📚' },
  { label: '계산 실수', emoji: '🔢' },
  { label: '문제 해석 오류', emoji: '📖' },
  { label: '기타', emoji: '💭' },
]

interface Props {
  question: string
  userAnswer: string
  correctAnswer: string
  topicId: string
  topicLabel: string
  quizLogId: string | null
  onSaved?: (attemptErrorId: string) => void
}

type Stage = 'category' | 'detail' | 'saving' | 'done' | 'error'

export default function ErrorTagSection(props: Props) {
  const [patterns, setPatterns] = useState<ErrorPattern[]>([])
  const [stage, setStage] = useState<Stage>('category')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [submittedNote, setSubmittedNote] = useState('')
  const [diagnosis, setDiagnosis] = useState<string>('')
  const [errMsg, setErrMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getErrorPatterns().then((rows) => {
      if (!cancelled) setPatterns(rows)
    })
    return () => { cancelled = true }
  }, [])

  function selectCategory(label: string) {
    setCategory(label)
    setNote('')
    setStage('detail')
  }

  async function commit() {
    const trimmed = note.trim()
    const patternName = trimmed ? `${category} — ${trimmed}` : category

    setStage('saving')
    setSubmittedNote(patternName)
    setErrMsg(null)

    let aiDiagnosis = ''
    try {
      const res = await fetch(`${API_URL}/api/error-patterns/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: props.question,
          userAnswer: props.userAnswer,
          correctAnswer: props.correctAnswer,
          patternName,
          topic: props.topicLabel,
          userNote: trimmed || null,
        }),
      })
      if (res.ok) {
        const body = (await res.json()) as { diagnosis?: string }
        aiDiagnosis = body.diagnosis ?? ''
      }
    } catch {
      // 진단 실패는 조용히 무시
    }

    const pattern = patterns[0] ?? null
    if (pattern) {
      const id = await tagAttemptError({
        quizLogId: props.quizLogId,
        patternId: pattern.patternId,
        topic: props.topicId,
        userNote: patternName,
        aiDiagnosis: aiDiagnosis || null,
      })
      if (id === null) {
        setStage('error')
        setErrMsg('저장 실패 — migration 008 이 적용됐는지 확인하세요.')
        return
      }
      props.onSaved?.(id)
    }

    setDiagnosis(aiDiagnosis)
    setStage('done')
  }

  return (
    <div
      className="rounded-xl"
      style={{ border: '1.5px solid #fecaca', background: '#fff7f7' }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#fee2e2' }}>
        <span className="text-xs font-semibold text-[#991b1b]">🔍 왜 틀렸나요?</span>
        <span className="text-[10px] text-[#991b1b] opacity-80">Error Pattern Library</span>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">

        {/* 1단계: 카테고리 선택 */}
        {stage === 'category' && (
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                onClick={() => selectCategory(c.label)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'white', border: '1.5px solid #fecaca', color: '#991b1b' }}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        )}

        {/* 2단계: 자유 텍스트 입력 */}
        {stage === 'detail' && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: '#fee2e2', color: '#991b1b' }}
              >
                {category}
              </span>
              <button
                onClick={() => setStage('category')}
                className="text-[10px] text-[#94a3b8] hover:text-[#64748b]"
              >
                변경
              </button>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void commit()
                }
              }}
              placeholder="구체적으로 어떤 부분을 몰랐나요?"
              autoFocus
              className="w-full text-xs p-3 rounded-lg"
              style={{
                border: '1px solid #fecaca',
                minHeight: 68,
                resize: 'none',
                outline: 'none',
                background: 'white',
                lineHeight: 1.6,
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#94a3b8]">비워도 저장됩니다</span>
              <button
                onClick={() => void commit()}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg text-white"
                style={{ background: '#ef4444' }}
              >
                진단받기
              </button>
            </div>
          </div>
        )}

        {stage === 'saving' && (
          <div className="flex items-center gap-2 text-xs text-[#64748b] py-2">
            <div className="w-3 h-3 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
            <span>저장 + Claude 진단 중…</span>
          </div>
        )}

        {stage === 'done' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <span className="text-xs font-semibold text-[#166534] shrink-0">✅ 저장됨</span>
              <span className="text-[11px] text-[#475569] leading-relaxed">{submittedNote}</span>
            </div>
            {diagnosis && (
              <div
                className="rounded-lg px-3 py-2.5"
                style={{ background: 'white', border: '1px solid #fecaca' }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    p: ({ children }) => (
                      <p style={{ fontSize: 11, lineHeight: 1.65, color: '#0f172a', margin: '0 0 6px 0' }}>
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong style={{ fontWeight: 600, color: '#0f172a' }}>{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em style={{ fontStyle: 'italic', color: '#475569' }}>{children}</em>
                    ),
                    li: ({ children }) => (
                      <li style={{ fontSize: 11, lineHeight: 1.65, color: '#0f172a', marginBottom: 4 }}>
                        {children}
                      </li>
                    ),
                    ul: ({ children }) => (
                      <ul style={{ paddingLeft: 14, margin: '0 0 6px 0' }}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol style={{ paddingLeft: 14, margin: '0 0 6px 0' }}>{children}</ol>
                    ),
                    hr: () => (
                      <hr style={{ border: 'none', borderTop: '1px solid #fecaca', margin: '8px 0' }} />
                    ),
                    table: ({ children }) => (
                      <div style={{ overflowX: 'auto', margin: '6px 0' }}>
                        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 10 }}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th style={{ border: '1px solid #fecaca', padding: '3px 6px', background: '#fee2e2', color: '#991b1b', fontWeight: 600, textAlign: 'left', wordBreak: 'break-word' }}>
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td style={{ border: '1px solid #fecaca', padding: '3px 6px', color: '#0f172a', wordBreak: 'break-word', verticalAlign: 'top' }}>
                        {children}
                      </td>
                    ),
                  }}
                >
                  {diagnosis
                    .replace(/\n?(\*?\*?\(\d+\)\*?\*?)/g, '\n\n$1')
                    .replace(/\n?(다음 체크포인트)/g, '\n\n---\n\n$1')
                    .trim()}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {stage === 'error' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#991b1b]">⚠️ {errMsg}</p>
            <button
              onClick={() => {
                setStage('category')
                setErrMsg(null)
              }}
              className="self-start text-[10px] px-2 py-1 rounded text-[#64748b]"
              style={{ border: '1px solid #e2e8f0' }}
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
