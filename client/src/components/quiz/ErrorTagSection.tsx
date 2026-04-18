import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getErrorPatterns,
  tagAttemptError,
  ErrorPattern,
} from '../../lib/db'

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001'

interface Props {
  question: string
  userAnswer: string
  correctAnswer: string
  topicId: string
  topicLabel: string
  /** 저장된 quiz_logs row id — saveQuizLog 가 fire-and-forget 이라 null 허용. */
  quizLogId: string | null
  /** RPC 저장이 성공했을 때 한 번 호출. 부모가 토스트/스낵바 등을 띄우는 용도. */
  onSaved?: (attemptErrorId: string) => void
}

type Stage = 'root' | 'exec' | 'saving' | 'done' | 'error'

export default function ErrorTagSection(props: Props) {
  const [patterns, setPatterns] = useState<ErrorPattern[]>([])
  const [loadingPatterns, setLoadingPatterns] = useState(true)
  const [stage, setStage] = useState<Stage>('root')
  const [rootPattern, setRootPattern] = useState<ErrorPattern | null>(null)
  const [chosen, setChosen] = useState<ErrorPattern | null>(null)
  const [note, setNote] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [diagnosis, setDiagnosis] = useState<string>('')
  const [errMsg, setErrMsg] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getErrorPatterns().then((rows) => {
      if (cancelled) return
      setPatterns(rows)
      setLoadingPatterns(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const roots = patterns.filter((p) => p.layer === 'root')
  const execs = patterns.filter((p) => p.layer === 'exec')

  async function commit(pattern: ErrorPattern, userNote: string | null) {
    setStage('saving')
    setChosen(pattern)
    setErrMsg(null)

    // 1. Claude 진단 호출 (실패해도 태깅은 저장 — diagnosis 는 빈 문자열로).
    let aiDiagnosis = ''
    try {
      const res = await fetch(`${API_URL}/api/error-patterns/diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: props.question,
          userAnswer: props.userAnswer,
          correctAnswer: props.correctAnswer,
          patternName: pattern.name,
          patternDescription: pattern.description,
          topic: props.topicLabel,
          userNote: userNote || null,
        }),
      })
      if (res.ok) {
        const body = (await res.json()) as { diagnosis?: string }
        aiDiagnosis = body.diagnosis ?? ''
      }
    } catch {
      // 진단 실패는 조용히 무시 — 저장은 계속.
    }

    // 2. RPC 태깅.
    const id = await tagAttemptError({
      quizLogId: props.quizLogId,
      patternId: pattern.patternId,
      topic: props.topicId,
      userNote,
      aiDiagnosis: aiDiagnosis || null,
    })

    if (id === null) {
      setStage('error')
      setErrMsg('저장 실패 — migration 008 이 적용됐는지 확인하세요.')
      return
    }

    setDiagnosis(aiDiagnosis)
    setStage('done')
    props.onSaved?.(id)
  }

  if (loadingPatterns) {
    return null // 패턴 목록 로드 전에는 조용히 숨김 — 퀴즈 흐름 방해 안 함.
  }
  if (patterns.length === 0) {
    return null // migration 008 미적용 환경 — 섹션 자체 숨김.
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: '1.5px solid #fecaca', background: '#fff7f7' }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#fee2e2' }}>
        <span className="text-xs font-semibold text-[#991b1b]">🔍 왜 틀렸나요?</span>
        <span className="text-[10px] text-[#991b1b] opacity-80">Error Pattern Library</span>
      </div>

      <div className="px-4 py-3 flex flex-col gap-3">
        {stage === 'root' && (
          <>
            <p className="text-xs text-[#64748b]">원인을 한 가지 고르면 세부 패턴을 보여드릴게요.</p>
            <div className="grid grid-cols-3 gap-2">
              {roots.map((r) => {
                const emoji =
                  r.patternId === 'E_ROOT_01' ? '🧠' :
                  r.patternId === 'E_ROOT_02' ? '🔢' : '📖'
                return (
                  <button
                    key={r.patternId}
                    onClick={() => {
                      setRootPattern(r)
                      setStage('exec')
                    }}
                    className="flex flex-col items-center gap-1 py-3 rounded-lg hover:bg-white text-center"
                    style={{ border: '1.5px solid #fecaca', background: 'white' }}
                  >
                    <span className="text-xl">{emoji}</span>
                    <span className="text-xs font-semibold text-[#0f172a]">{r.name}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {stage === 'exec' && rootPattern && (
          <>
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <span>선택:</span>
              <span
                className="px-2 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: '#fee2e2', color: '#991b1b' }}
              >
                {rootPattern.name}
              </span>
              <button
                onClick={() => {
                  setRootPattern(null)
                  setStage('root')
                }}
                className="ml-auto text-[10px] underline text-[#64748b]"
              >
                다시 선택
              </button>
            </div>
            <p className="text-xs text-[#64748b]">이번에 걸린 세부 패턴은?</p>
            <div className="flex flex-col gap-1.5">
              {execs.map((e) => (
                <button
                  key={e.patternId}
                  onClick={() => void commit(e, null)}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-white text-left"
                  style={{ border: '1px solid #fecaca', background: 'white' }}
                >
                  <span className="text-xs font-medium text-[#0f172a]">{e.name}</span>
                  <span className="text-[9px] text-muted font-mono">{e.patternId}</span>
                </button>
              ))}
              {!showNoteInput ? (
                <button
                  onClick={() => setShowNoteInput(true)}
                  className="px-3 py-2 rounded-lg text-xs text-[#64748b] hover:bg-white text-left"
                  style={{ border: '1px dashed #fecaca' }}
                >
                  ✏️ 기타 (직접 입력)
                </button>
              ) : (
                <div className="flex flex-col gap-2 p-2 rounded-lg" style={{ border: '1px solid #fecaca', background: 'white' }}>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="이번에 구체적으로 무엇이 헷갈렸는지 한 줄로…"
                    className="w-full text-xs p-2 rounded"
                    style={{ border: '1px solid #e2e8f0', minHeight: 60, resize: 'vertical' }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowNoteInput(false)
                        setNote('')
                      }}
                      className="text-[10px] px-2 py-1 rounded text-[#64748b]"
                      style={{ border: '1px solid #e2e8f0' }}
                    >
                      취소
                    </button>
                    <button
                      onClick={() => {
                        if (!rootPattern || !note.trim()) return
                        void commit(rootPattern, note.trim())
                      }}
                      disabled={!note.trim()}
                      className="text-[10px] px-2 py-1 rounded text-white disabled:opacity-40"
                      style={{ background: '#ef4444' }}
                    >
                      저장
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {stage === 'saving' && (
          <div className="flex items-center gap-2 text-xs text-[#64748b] py-2">
            <div className="w-3 h-3 border-2 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
            <span>저장 + Claude 진단 중…</span>
          </div>
        )}

        {stage === 'done' && chosen && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#166534]">✅ 저장됨</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{ background: '#fee2e2', color: '#991b1b' }}
              >
                {chosen.name}
              </span>
              <span className="text-[9px] text-muted font-mono">{chosen.patternId}</span>
            </div>
            {diagnosis && (
              <div
                className="text-xs text-[#0f172a] leading-relaxed p-3 rounded prose prose-xs max-w-none"
                style={{ background: 'white', border: '1px solid #fecaca' }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosis}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {stage === 'error' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-[#991b1b]">⚠️ {errMsg}</p>
            <button
              onClick={() => {
                setStage('root')
                setChosen(null)
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
