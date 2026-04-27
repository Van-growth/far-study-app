import { useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'

const THEMES = [
  { text: "You're on fire! 🔥",  emojis: ['🔥', '💥', '⚡️'] },
  { text: 'Unstoppable! 💥',      emojis: ['💥', '🚀', '⚡️', '💪'] },
  { text: 'Keep stacking! 🪙',    emojis: ['🪙', '💰', '💵', '💴'] },
  { text: 'Legend behavior 👑',   emojis: ['👑', '🏆', '⭐️', '💎'] },
] as const

const KEYFRAMES = `
@keyframes moneyFall {
  0%   { transform: translateY(-80px) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(110vh) rotate(560deg); opacity: 0; }
}
@keyframes richPulse {
  0%, 100% { transform: scale(1) rotate(-1.5deg); }
  50%       { transform: scale(1.07) rotate(1.5deg); }
}
`

function playCoins() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    for (let i = 0; i < 18; i++) {
      const t = ctx.currentTime + Math.random() * 2.6
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 900 + Math.random() * 700
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.2, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11)
      osc.start(t)
      osc.stop(t + 0.15)
    }
    setTimeout(() => {
      try { ctx.close() } catch { /* ignore */ }
    }, 3500)
  } catch { /* AudioContext unavailable */ }
}

interface Props {
  open: boolean
  count: number
  onClose: () => void
}

export default function MoneyRainOverlay({ open, count, onClose }: Props) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    playCoins()
    const t = setTimeout(() => onCloseRef.current(), 3000)
    return () => clearTimeout(t)
  }, [open])

  const theme = useMemo(
    () => (open ? THEMES[Math.floor(Math.random() * THEMES.length)] : THEMES[0]),
    [open],
  )

  const coins = useMemo(() => {
    if (!open) return []
    return Array.from({ length: 42 }, (_, i) => ({
      id: i,
      emoji: theme.emojis[Math.floor(Math.random() * theme.emojis.length)],
      left: Math.random() * 96 + 1,
      delay: Math.random() * 1.8,
      duration: 1.5 + Math.random() * 1.5,
      size: 1.4 + Math.random() * 1.0,
    }))
  }, [open, theme])

  if (!open) return null

  return createPortal(
    <>
      <style>{KEYFRAMES}</style>
      <div
        onClick={() => onCloseRef.current()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.68)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {coins.map((c) => (
          <span
            key={c.id}
            style={{
              position: 'fixed',
              top: 0,
              left: `${c.left}%`,
              fontSize: `${c.size}rem`,
              animationName: 'moneyFall',
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards',
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              pointerEvents: 'none',
            }}
          >
            {c.emoji}
          </span>
        ))}

        <div
          style={{
            position: 'relative',
            zIndex: 10,
            textAlign: 'center',
            pointerEvents: 'none',
            userSelect: 'none',
            padding: '0 24px',
          }}
        >
          <p
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 3.5rem)',
              fontWeight: 800,
              color: 'white',
              textShadow: '0 4px 24px rgba(0,0,0,0.5)',
              animationName: 'richPulse',
              animationDuration: '0.7s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }}
          >
            {theme.text}
          </p>
          <p
            style={{
              marginTop: 12,
              fontSize: '1.1rem',
              color: 'rgba(255,255,255,0.82)',
              fontWeight: 500,
            }}
          >
            오늘 {count}문제 완료
          </p>
        </div>
      </div>
    </>,
    document.body,
  )
}
