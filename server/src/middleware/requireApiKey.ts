import { Request, Response, NextFunction } from 'express';

// 개인용 앱 — Supabase JWT 검증 대신 고정 API 키 헤더로 유료 API(Anthropic/Google TTS)
// 호출 라우트만 최소 보호. 클라이언트(VITE_APP_API_KEY)가 매 요청에 같은 값을 실어 보낸다.
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-app-api-key'];
  const expected = process.env.APP_API_KEY;
  if (!expected || key !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
