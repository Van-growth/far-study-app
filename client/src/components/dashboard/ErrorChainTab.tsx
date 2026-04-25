import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStudyStore from '../../store/studyStore'
import {
  getErrorPatterns,
  getMyPatternStats,
  ErrorPattern,
  MyPatternStat,
  ErrorPatternLayer,
} from '../../lib/db'
import { ERROR_CHAIN } from '../../constants/errorPatterns'

const layerColor: Record<ErrorPatternLayer, string> = {
  root: '#ef4444',
  exec: '#4f6ef7',
  outcome: '#0f766e',
}

export default function ErrorChainTab() {
  const navigate = useNavigate()
  const userId = useStudyStore((s) => s.userId)
  const [patterns, setPatterns] = useState<ErrorPattern[]>([])
  const [myStats, setMyStats] = useState<MyPatternStat[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [p, m] = await Promise.all([
        getErrorPatterns(),
        userId ? getMyPatternStats(userId) : Promise.resolve([] as MyPatternStat[]),
      ])
      if (cancelled) return
      setPatterns(p)
      setMyStats(m)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const byId = useMemo(
    () => new Map(patterns.map((p) => [p.patternId, p])),
    [patterns],
  )
  const myById = useMemo(
    () => new Map(myStats.map((s) => [s.patternId, s])),
    [myStats],
  )

  const groups = useMemo(() => {
    const roots = patterns.filter((p) => p.layer === 'root')
    const execs = patterns.filter((p) => p.layer === 'exec')
    const outcomes = patterns.filter((p) => p.layer === 'outcome')
    return { roots, execs, outcomes }
  }, [patterns])

  const selected = selectedId ? byId.get(selectedId) ?? null : null
  const chain = selected && selected.layer === 'root' ? ERROR_CHAIN[selected.patternId] : null

  const recommendedTopic = useMemo(() => {
    if (!selected) return null
    // linked_topics 의 첫 항목을 추천 대상으로 사용 (F1_NFP → F1 처럼 단순 prefix).
    const raw = selected.linkedTopics[0]
    if (!raw) return null
    const head = raw.split('_')[0]
    return head ?? null
  }, [selected])

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* 좌: 패턴 목록 */}
      <div className="card p-3 md:w-[200px] shrink-0 flex flex-col gap-3">
        {(['root', 'exec', 'outcome'] as ErrorPatternLayer[]).map((layer) => {
          const list =
            layer === 'root' ? groups.roots :
            layer === 'exec' ? groups.execs : groups.outcomes
          return (
            <div key={layer}>
              <div
                className="text-[10px] font-semibold mb-1.5 px-1"
                style={{ color: layerColor[layer] }}
              >
                {layer === 'root' ? '원인' : layer === 'exec' ? '실행' : '결과'} ({list.length})
              </div>
              <div className="flex flex-col gap-1">
                {list.map((p) => {
                  const mine = myById.get(p.patternId)
                  const active = selectedId === p.patternId
                  return (
                    <button
                      key={p.patternId}
                      onClick={() => setSelectedId(p.patternId)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-left"
                      style={{
                        background: active ? layerColor[layer] + '18' : 'transparent',
                        border: active ? `1px solid ${layerColor[layer]}` : '1px solid transparent',
                      }}
                    >
                      <span className="text-[11px] flex-1 truncate text-[#0f172a]">{p.name}</span>
                      {mine && mine.occurrence > 0 && (
                        <span
                          className="text-[9px] font-bold px-1 rounded"
                          style={{ background: '#fee2e2', color: '#991b1b' }}
                        >
                          {mine.occurrence}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* 중: 상세 + 체인 시각화 */}
      <div className="card p-5 flex-1 min-w-0">
        {!selected ? (
          <div className="text-center py-16 text-sm text-muted">
            좌측 패널에서 Error Pattern 을 선택하세요.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                  style={{ background: layerColor[selected.layer] + '20', color: layerColor[selected.layer] }}
                >
                  {selected.layer}
                </span>
                <span className="text-[10px] text-muted font-mono">{selected.patternId}</span>
              </div>
              <h3 className="text-lg font-bold text-[#0f172a]">{selected.name}</h3>
              {selected.description && (
                <p className="text-sm text-muted mt-1">{selected.description}</p>
              )}
            </div>

            {chain && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-[#0f172a]">Chain 시각화</div>
                <ChainNode pattern={selected} mine={myById.get(selected.patternId)} />
                <ChainArrow />
                {chain.execs.slice(0, 2).map((execId) => {
                  const execP = byId.get(execId)
                  if (!execP) return null
                  return (
                    <div key={execId} className="pl-4 flex flex-col gap-2">
                      <ChainNode pattern={execP} mine={myById.get(execId)} />
                    </div>
                  )
                })}
                <ChainArrow />
                {chain.outcomes.slice(0, 1).map((outId) => {
                  const outP = byId.get(outId)
                  if (!outP) return null
                  return (
                    <div key={outId} className="pl-8">
                      <ChainNode pattern={outP} mine={myById.get(outId)} />
                    </div>
                  )
                })}
              </div>
            )}

            {selected.linkedTopics.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-[#0f172a] mb-1.5">연결된 토픽</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.linkedTopics.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded font-mono"
                      style={{ background: '#f1f5f9', color: '#475569' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 우: 처방 */}
      <div className="card p-4 md:w-[220px] shrink-0">
        {!selected ? (
          <p className="text-xs text-muted">패턴을 선택하면 오늘 처방을 받을 수 있어요.</p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold text-[#0f172a]">오늘 처방</div>
            <div className="text-xs text-muted leading-relaxed">
              {selected.layer === 'root'
                ? '원인 층 — 개념 카드부터 복습한 후, 아래 버튼으로 직접 문제를 풀어보세요.'
                : selected.layer === 'exec'
                ? '실행 층 — 같은 유형 10문항을 연속으로 풀어 손에 익혀요.'
                : '결과 층 — 반복 오답 구간. 약점 모드로 집중 공략하세요.'}
            </div>
            <button
              onClick={() => {
                if (recommendedTopic) {
                  navigate(`/quiz?topicId=${recommendedTopic}`)
                } else {
                  navigate('/quiz?mode=weak')
                }
              }}
              className="py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: layerColor[selected.layer] }}
            >
              지금 풀기 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ChainNode({ pattern, mine }: { pattern: ErrorPattern; mine?: MyPatternStat }) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg"
      style={{
        background: layerColor[pattern.layer] + '10',
        border: `1px solid ${layerColor[pattern.layer]}40`,
      }}
    >
      <span className="text-[9px] text-muted font-mono">{pattern.patternId}</span>
      <span className="text-xs font-medium text-[#0f172a] flex-1 truncate">{pattern.name}</span>
      {mine && mine.occurrence > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#ef4444', color: 'white' }}>
          {mine.occurrence}회
        </span>
      )}
    </div>
  )
}

function ChainArrow() {
  return <div className="text-center text-muted text-xs">↓</div>
}
