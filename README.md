# FAR Study App — USCPA

Ivy League 검증 학습법(Active Recall · Spaced Repetition · Feynman Technique · Interleaving)으로 FAR 시험을 준비하는 웹앱.

## 아키텍처

```
[React 클라이언트]
  ├── Supabase JS SDK → Supabase (DB + Auth + RLS)
  └── fetch → Express 서버 → Claude API (키 보호)

[Render]
  ├── Express 서버 (Claude API proxy만 담당)
  └── Static Site (React 빌드)

[Supabase]
  ├── PostgreSQL (topic_progress, quiz_logs, study_sessions)
  ├── Auth (이메일 로그인)
  └── Row Level Security (본인 데이터만 접근)
```

## 로컬 실행

### 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) → New Project 생성
2. SQL Editor → `supabase/migrations/001_init.sql` 실행
3. Settings → API → Project URL, anon key 복사

### 2. 환경변수 설정

```bash
# client
cp client/.env.example client/.env
# → VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL 입력

# server
cp server/.env.example server/.env
# → ANTHROPIC_API_KEY 입력
```

### 3. 서버 실행

```bash
cd server
npm install
npm run dev    # → http://localhost:3001
```

### 4. 클라이언트 실행

```bash
cd client
npm install
npm run dev    # → http://localhost:5173
```

## Render 배포

1. GitHub에 push
2. Render → New Blueprint → `render.yaml` 선택
3. 환경변수 입력:
   - **서버**: `ANTHROPIC_API_KEY`, `CLIENT_URL` (클라이언트 Render URL)
   - **클라이언트**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (서버 Render URL)
4. Deploy — 자동 배포

### GitHub Actions (자동 배포)

Secrets에 추가:
- `RENDER_DEPLOY_HOOK_SERVER`
- `RENDER_DEPLOY_HOOK_CLIENT`

main push 시 자동으로 Render deploy 트리거.

## Tech Stack

| 항목 | 기술 |
|------|------|
| 프론트엔드 | React 18 + TypeScript + Vite |
| 스타일 | Tailwind CSS 3 |
| 상태관리 | Zustand + localStorage persist |
| 라우팅 | React Router v6 |
| DB / Auth | Supabase (PostgreSQL + Auth + RLS) |
| AI 튜터 | Claude API (Haiku via Express proxy) |
| 배포 | Render (Blueprint) |
| CI/CD | GitHub Actions |

## 주요 기능

- **Active Recall** — 플래시카드 3단계 (토픽 확인 → 직접 작성 → 자기평가)
- **Spaced Repetition** — 1→3→7→14→30→60일 간격 복습
- **Feynman Technique** — Claude AI 피드백으로 설명 능력 평가
- **Interleaving** — 토픽 셔플 퀴즈 (같은 토픽 연속 방지)
- **Claude 사이드 패널** — SSE 스트리밍 채팅, 퀴즈 해설, 개념 질문
- **오답노트** — Supabase에 자동 저장, 토픽별 필터, Claude 해설
- **학습 캘린더** — GitHub 잔디 스타일 히트맵
- **이메일 로그인** — Supabase Auth, RLS로 데이터 보호
