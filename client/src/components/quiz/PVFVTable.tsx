import { useMemo, useState } from 'react';

const RATES = [0.04, 0.05, 0.06, 0.08, 0.10, 0.12];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];

type FormulaKey = 'pv1' | 'fv1' | 'pvA' | 'fvA';

const LABELS: Record<FormulaKey, string> = {
  pv1: 'PV of $1',
  fv1: 'FV of $1',
  pvA: 'PV of Annuity of $1',
  fvA: 'FV of Annuity of $1',
};

function coef(kind: FormulaKey, r: number, n: number): number {
  const pow = Math.pow(1 + r, n);
  switch (kind) {
    case 'pv1':
      return 1 / pow;
    case 'fv1':
      return pow;
    case 'pvA':
      return (1 - 1 / pow) / r;
    case 'fvA':
      return (pow - 1) / r;
  }
}

const KEYWORDS = [
  'present value', 'future value', 'annuity', 'pv of', 'fv of',
  'discount rate', 'compound', 'interest rate', 'periodic payment',
  '현재가치', '미래가치', '연금', '할인율', '복리', 'pv(', 'fv(',
];

export function questionNeedsPVFVTable(text: string | undefined | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return KEYWORDS.some((k) => lower.includes(k));
}

export default function PVFVTable() {
  const [active, setActive] = useState<FormulaKey>('pv1');
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      PERIODS.map((n) => ({
        n,
        values: RATES.map((r) => coef(active, r, n)),
      })),
    [active],
  );

  return (
    <div className="mt-3 rounded-xl" style={{ border: '1px solid #e2e8f0', background: '#f8fafc' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-[#0f172a]"
      >
        <span>📐 연금계수 표 (PV/FV)</span>
        <span className="text-muted">{open ? '접기 ▴' : '펼치기 ▾'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-1 mb-2">
            {(Object.keys(LABELS) as FormulaKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setActive(k)}
                className="text-[11px] px-2 py-1 rounded-full"
                style={{
                  background: active === k ? '#4f6ef7' : 'white',
                  color: active === k ? 'white' : '#475569',
                  border: '1px solid #cbd5e1',
                }}
              >
                {LABELS[k]}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="text-[10px] w-full border-collapse">
              <thead>
                <tr style={{ background: '#eef2ff' }}>
                  <th className="px-1.5 py-1 border border-[#cbd5e1] text-left">n \ r</th>
                  {RATES.map((r) => (
                    <th key={r} className="px-1.5 py-1 border border-[#cbd5e1]">
                      {(r * 100).toFixed(0)}%
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.n}>
                    <td className="px-1.5 py-1 border border-[#cbd5e1] font-semibold">{row.n}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className="px-1.5 py-1 border border-[#cbd5e1] text-right font-mono">
                        {v.toFixed(4)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
