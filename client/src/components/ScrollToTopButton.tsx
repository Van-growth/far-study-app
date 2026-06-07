import { useEffect, useRef, useState } from 'react';

interface Props {
  scrollRef: React.RefObject<HTMLElement | null>;
}

export default function ScrollToTopButton({ scrollRef }: Props) {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handler = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setVisible(el.scrollTop > 300);
      });
    };

    el.addEventListener('scroll', handler, { passive: true });
    return () => {
      el.removeEventListener('scroll', handler);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollRef]);

  if (!visible) return null;

  return (
    <button
      onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="맨 위로"
      style={{
        position: 'fixed',
        bottom: 72,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: '#4f6ef7',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        zIndex: 30,
        boxShadow: '0 2px 8px rgba(79,110,247,0.35)',
        opacity: 0.92,
      }}
    >
      ↑
    </button>
  );
}
