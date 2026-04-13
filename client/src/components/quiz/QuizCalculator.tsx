import { useState } from 'react';

interface HistoryEntry {
  id: number;
  expression: string;
  result: string;
}

// Safely evaluate a numeric expression limited to digits, decimal points,
// whitespace, parentheses, and the four operators. Uses Function constructor
// but only after whitelisting the characters — no identifiers allowed.
function safeEval(expr: string): string {
  const cleaned = expr.replace(/\s+/g, '');
  if (!/^[0-9+\-*/().%]+$/.test(cleaned)) return 'Error';
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const val = Function(`"use strict"; return (${cleaned});`)();
    if (typeof val !== 'number' || !isFinite(val)) return 'Error';
    return String(Math.round(val * 1e8) / 1e8);
  } catch {
    return 'Error';
  }
}

const KEYS = [
  ['7', '8', '9', '/'],
  ['4', '5', '6', '*'],
  ['1', '2', '3', '-'],
  ['0', '.', '=', '+'],
];

interface QuizCalculatorProps {
  open: boolean;
  onClose: () => void;
}

export default function QuizCalculator({ open, onClose }: QuizCalculatorProps) {
  const [display, setDisplay] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const press = (k: string) => {
    if (k === '=') {
      if (!display) return;
      const r = safeEval(display);
      setHistory((h) => [{ id: Date.now(), expression: display, result: r }, ...h].slice(0, 20));
      setDisplay(r === 'Error' ? '' : r);
      return;
    }
    setDisplay((d) => d + k);
  };
  const clear = () => setDisplay('');
  const back = () => setDisplay((d) => d.slice(0, -1));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-4 flex flex-col gap-3 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm text-[#0f172a]">🧮 계산기</p>
          <button onClick={onClose} className="text-muted text-lg">
            ×
          </button>
        </div>

        <div className="flex gap-3">
          {/* Calculator */}
          <div className="flex-1 flex flex-col gap-2">
            <div
              className="text-right font-mono text-lg px-3 py-2 rounded-lg min-h-[44px]"
              style={{ background: '#f1f5f9', color: '#0f172a' }}
            >
              {display || '0'}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button onClick={clear} className="col-span-2 py-2 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm font-semibold">
                C
              </button>
              <button onClick={back} className="col-span-2 py-2 rounded-lg bg-[#fef3c7] text-[#92400e] text-sm font-semibold">
                ←
              </button>
              {KEYS.flat().map((k) => (
                <button
                  key={k}
                  onClick={() => press(k)}
                  className="py-2.5 rounded-lg text-sm font-semibold"
                  style={{
                    background: k === '=' ? '#4f6ef7' : '#f8fafc',
                    color: k === '=' ? 'white' : '#0f172a',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          <div className="w-28 shrink-0 flex flex-col gap-1 max-h-[280px] overflow-y-auto">
            <p className="text-[10px] text-muted font-semibold">History</p>
            {history.length === 0 && <p className="text-[10px] text-muted">—</p>}
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => setDisplay(h.result === 'Error' ? h.expression : h.result)}
                className="text-left text-[10px] p-1 rounded hover:bg-gray-100"
              >
                <div className="text-muted truncate">{h.expression}</div>
                <div className="font-mono text-[#0f172a]">= {h.result}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
