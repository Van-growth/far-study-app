import { useState } from 'react';
import { createPortal } from 'react-dom';

interface HistoryEntry {
  id: number;
  expression: string;
  result: string;
}

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

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-50 w-72 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ border: '1px solid #e2e8f0', maxHeight: '380px' }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid #f1f5f9' }}
      >
        <p className="font-semibold text-sm text-[#0f172a]">🧮 계산기</p>
        <button
          onClick={onClose}
          className="text-[#94a3b8] text-lg w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100"
        >
          ×
        </button>
      </div>

      <div className="flex gap-2 p-2.5 flex-1 min-h-0 overflow-hidden">
        {/* Calculator */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div
            className="text-right font-mono text-base px-2.5 py-1.5 rounded-lg shrink-0"
            style={{ background: '#f1f5f9', color: '#0f172a' }}
          >
            {display || '0'}
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button onClick={clear} className="col-span-2 py-1.5 rounded-lg bg-[#fee2e2] text-[#991b1b] text-sm font-semibold">
              C
            </button>
            <button onClick={back} className="col-span-2 py-1.5 rounded-lg bg-[#fef3c7] text-[#92400e] text-sm font-semibold">
              ←
            </button>
            {KEYS.flat().map((k) => (
              <button
                key={k}
                onClick={() => press(k)}
                className="py-1.5 rounded-lg text-sm font-semibold"
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
        <div className="w-20 shrink-0 flex flex-col gap-1 overflow-y-auto">
          <p className="text-[10px] text-[#94a3b8] font-semibold">History</p>
          {history.length === 0 && <p className="text-[10px] text-[#94a3b8]">—</p>}
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => setDisplay(h.result === 'Error' ? h.expression : h.result)}
              className="text-left text-[10px] p-1 rounded hover:bg-gray-100"
            >
              <div className="text-[#94a3b8] truncate">{h.expression}</div>
              <div className="font-mono text-[#0f172a]">= {h.result}</div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
