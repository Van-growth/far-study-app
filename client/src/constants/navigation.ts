export const MORE_MENU_ITEMS = [
  { label: '📊 대시보드', path: '/dashboard' },
  { label: '✏️ 퀴즈', path: '/quiz?mode=interleave' },
  { label: '🏆 뱃지 & 성취', path: '/badges' },
  { label: '📑 개념노트', path: '/concept-notes' },
  { label: '📈 학습 효과', path: '/learning' },
] as const;

export const ADMIN_MENU_ITEM = { label: '🛠️ Admin', path: '/admin' } as const;
