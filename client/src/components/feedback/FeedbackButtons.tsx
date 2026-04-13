import { useState } from 'react';
import useStudyStore from '../../store/studyStore';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001';

interface FeedbackButtonsProps {
  messageId: string;
  messagePreview: string;
  source: 'claude' | 'coach' | 'quiz';
  topicId?: string | null;
}

const REASONS = [
  '문제 계산 오류',
  '문제 개념 오류',
  '문제 불명확',
  '정답 오류',
  '선택지 오류',
  '해설 오류',
  '실제 시험과 다른 유형',
  '기타',
] as const;

export default function FeedbackButtons({
  messageId,
  messagePreview,
  source,
  topicId,
}: FeedbackButtonsProps) {
  const userId = useStudyStore((s) => s.userId);
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState('');

  const submit = async (r: 'up' | 'down', reasonText?: string, commentText?: string) => {
    try {
      await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          source,
          messageId,
          rating: r,
          reason: reasonText ?? null,
          comment: commentText ?? null,
          messagePreview,
          topicId: topicId ?? null,
        }),
      });
    } catch {
      /* background */
    }
  };

  const handleUp = () => {
    if (rating) return;
    setRating('up');
    void submit('up');
  };
  const handleDown = () => {
    if (rating) return;
    setModalOpen(true);
  };
  const confirmDown = () => {
    if (!reason) return;
    setRating('down');
    setModalOpen(false);
    void submit('down', reason, comment.trim() || undefined);
  };

  return (
    <div className="flex items-center gap-1 mt-1.5">
      <button
        onClick={handleUp}
        disabled={!!rating}
        className="w-6 h-6 flex items-center justify-center rounded-md text-xs hover:bg-gray-100 disabled:opacity-40"
        title="도움됨"
      >
        {rating === 'up' ? '👍' : <span className="opacity-60 hover:opacity-100">👍</span>}
      </button>
      <button
        onClick={handleDown}
        disabled={!!rating}
        className="w-6 h-6 flex items-center justify-center rounded-md text-xs hover:bg-gray-100 disabled:opacity-40"
        title="도움 안됨"
      >
        {rating === 'down' ? '👎' : <span className="opacity-60 hover:opacity-100">👎</span>}
      </button>
      {rating && <span className="text-[10px] text-muted ml-1">피드백 고마워요</span>}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col gap-3 max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-sm text-[#0f172a]">오류 유형을 선택해주세요</p>
            <div className="flex flex-col gap-1.5">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-muted">추가 의견 (선택)</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="올바른 정답/풀이를 알고 있으면 입력해주세요"
                rows={3}
                className="w-full text-sm p-2 rounded-lg border border-[#e2e8f0] outline-none resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end mt-1">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-sm text-muted hover:bg-gray-100"
              >
                취소
              </button>
              <button
                onClick={confirmDown}
                disabled={!reason}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: '#4f6ef7' }}
              >
                제출
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
