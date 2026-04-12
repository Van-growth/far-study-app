import { useEffect } from 'react';
import Sidebar from './Sidebar';

interface MobileSectionDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSectionDrawer({ open, onClose }: MobileSectionDrawerProps) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-[60] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Spacer pushes the sheet to the bottom */}
      <div className="relative flex-1" onClick={onClose} />

      {/* Bottom sheet — ~75vh tall, scrollable inside */}
      <div
        className="relative bg-white rounded-t-2xl shadow-xl flex flex-col animate-slideUp"
        style={{
          maxHeight: '78dvh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Handle + header */}
        <div className="shrink-0 pt-2 pb-1 flex flex-col items-center">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="shrink-0 px-4 py-2 flex items-center justify-between border-b border-border">
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">📚 Becker F1–F6</p>
            <p className="text-[10px] text-muted">모듈을 선택하면 해당 퀴즈가 시작됩니다.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-[#0f172a] hover:bg-gray-100 text-base"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* Sidebar content — internally scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Sidebar onItemClick={onClose} />
        </div>
      </div>
    </div>
  );
}
