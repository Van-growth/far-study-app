// 유료 API(Anthropic/Google TTS) 호출 라우트 전용 fetch 래퍼 —
// server/src/middleware/requireApiKey.ts가 요구하는 x-app-api-key 헤더를 자동 첨부.
const APP_API_KEY = import.meta.env.VITE_APP_API_KEY as string | undefined;

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      'x-app-api-key': APP_API_KEY ?? '',
    },
  });
}
