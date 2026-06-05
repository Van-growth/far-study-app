export const DESIGN_PRINCIPLES = {
  core: "모든 것이 하나의 레이어에서 움직인다",
  rules: [
    "모달 중첩 금지 — 모달 안에 모달 구조 절대 금지",
    "팝업 금지 — 별도 창/레이어 분리 금지",
    "탭 최소화 — 탭 대신 스크롤로 대체",
    "Harry 우측 고정 패널 — 항상 같은 레이어",
    "SVG 시각화 인라인 렌더링 — 모달 없이 페이지에 직접",
    "Notion·Linear처럼 하나의 캔버스에서 작동",
  ],
  antiPatterns: [
    "Becker처럼 모달 안에 모달 — 절대 금지",
    "페이지 → 탭 → 모달 → 모달 구조 — 절대 금지",
    "사이드바 안에 팝업 — 금지",
  ],
};

export const COLORS = {
  bg: {
    primary: "#fafaf8",
    surface: "#ffffff",
    surface2: "#f3f3f0",
    hover: "#f0efeb",
  },
  text: {
    primary: "#1a1a1a",
    secondary: "#555555",
    tertiary: "#888888",
    navy: "#1a2744",
  },
  border: {
    default: "#e8e8e4",
    strong: "#d0d0c8",
  },
  semantic: {
    trap: "#dc2626",
    trapBg: "#fef2f2",
    speed: "#1a2744",
    formula: "#f0f4ff",
    trigger: "#f5f5f0",
  },
  topic: {
    bond: { bg: "#f5f3ff", border: "#7c3aed", text: "#5b21b6" },
    lease: { bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
    note: { bg: "#fffbeb", border: "#d97706", text: "#92400e" },
    aro: { bg: "#fff7ed", border: "#ea580c", text: "#9a3412" },
    tax: { bg: "#f0fdf4", border: "#059669", text: "#065f46" },
    eps: { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a" },
    inventory: { bg: "#fdf4ff", border: "#a21caf", text: "#701a75" },
    tdr: { bg: "#fff1f2", border: "#e11d48", text: "#9f1239" },
  },
};

export const TYPOGRAPHY = {
  fonts: {
    sans: "'Noto Sans KR', 'Noto Sans', -apple-system, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  sizes: {
    h1: "22px",
    h2: "16px",
    h3: "13px",
    body: "14px",
    small: "12px",
  },
  weights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: 1.7,
};

export const SPACING = {
  section: "32px",
  card: "16px 20px",
  gap: "1.7",
};

export const COMPONENTS = {
  card: {
    bg: "#ffffff",
    border: "1px solid #e8e8e4",
    radius: "12px",
    padding: "20px 24px",
  },
  trapBox: {
    bg: "#fef2f2",
    borderLeft: "4px solid #dc2626",
    radius: "0 8px 8px 0",
  },
  speedBox: {
    bg: "#1a2744",
    color: "#ffffff",
    radius: "8px",
  },
  journalEntry: {
    bg: "#f8f9fa",
    borderLeft: "3px solid #1a2744",
    fontFamily: "monospace",
  },
};
