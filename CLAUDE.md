# FAR Study App — Claude Code 운영 원칙

## 1. Single Source of Truth (SSOT) / DRY 원칙
- AI 시스템 프롬프트는 반드시 단일 파일에서 관리 (`server/prompts/` 또는 `src/prompts/`)
- 튜터/브리핑/오답진단 등 기능별 프롬프트를 파일에 분리, 인라인 하드코딩 금지
- /re, /go 등 슬래시 커맨드 정의는 프롬프트 파일 한 곳에서만 관리
- Supabase 테이블명·컬럼명 상수화 (`constants/db.ts`), 문자열 직접 사용 금지

## 2. FACT 기반 데이터 원칙
- AI 출력은 DB에 실제 존재하는 데이터만 사용 (concept_extractions, error_patterns 등)
- 추정값·더미 데이터 절대 금지 — 데이터 없으면 Empty State 명시적으로 표시
- 일일 브리핑·오답 분석 등 통계는 실제 학습 기록(daily_review_log, analysis_history) 기반
- backfill 미완료 컬럼(example_question 등) 접근 시 null 방어 처리 필수

## 3. 토큰 비용 최적화
### 모델 분리 원칙
- Haiku: 튜터 대화, 복습 브리핑, 슬래시 커맨드 응답, 예시 문제 생성
- Sonnet: 오답 원인 분석, 종합 피드백, 학습 패턴 진단 (호출 빈도 낮은 것만)

### 컨텍스트 최소화
- 튜터 시스템 프롬프트: 현재 복습 카드 데이터만 주입 (question, correct_answer, explanation, module, topic, concept)
- 관련 없는 전체 개념 목록·히스토리 전체 전달 금지
- 6턴 초과 시 히스토리 압축: 이전 대화 요약 1~2문장으로 교체, 원문 제거
- Edge Function 호출 시 필요한 필드만 select (SELECT * 금지)

## 4. 에러 처리 원칙
- 조용한 실패 금지 — DB 상태 기록 + 사용자 화면 메시지 표시 병행
- 200 응답도 실제 처리 결과 검증 (content[0].text 파싱 후 유효성 확인)
- Supabase Edge Function 오류는 Supabase 대시보드 로그 + 클라이언트 콘솔 양쪽 확인
- null/undefined 방어: DB 컬럼 접근 시 optional chaining (`?.`) 필수

## 5. DB 설계 원칙
- 컬럼 추가 시 마이그레이션 번호 순서 준수 (현재 015까지 완료)
- 마이그레이션 실행 전 계획 먼저 공유 후 진행
- jsonb 컬럼(example_question, triggers 등) 접근 시 구조 검증 후 사용
- Supabase project ID: rtvxplocohllzwdlzjaz

## 6. 보안 원칙
- API 키 하드코딩 절대 금지 — Render/Supabase 환경변수에서만 관리
- ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY 등 민감 정보 코드에 포함 금지
- 클라이언트에서 service_role_key 직접 호출 금지 (서버 경유 필수)

## 7. 배포 원칙
- Render 배포: 작업 완료 후 git add → commit → push → 아래 두 서비스 즉시 배포 트리거
- 커밋 메시지: `fix:` / `feat:` / `refactor:` prefix 사용
- 작업 전 변경 파일 목록과 수정 내용 계획 먼저 공유 후 진행
- 배포 후 Render 로그에서 빌드 성공 확인

| 서비스 | ID |
|--------|-----|
| far-study-app (client) | `srv-d7d5g97avr4c73drrtg0` |
| far-study-app-server (server) | `srv-d7d57k1j2pic73fcbgbg` |

```bash
# client
curl -s -X POST \
  -H "Authorization: Bearer rnd_ulPxarw9izFc7685TpBAxfdWb7mD" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/srv-d7d5g97avr4c73drrtg0/deploys"

# server
curl -s -X POST \
  -H "Authorization: Bearer rnd_ulPxarw9izFc7685TpBAxfdWb7mD" \
  -H "Content-Type: application/json" \
  "https://api.render.com/v1/services/srv-d7d57k1j2pic73fcbgbg/deploys"
```

## 제품 비전
FAR Study App은 단순 공부 앱이 아닌 AI 학습 코치를 지향합니다.

핵심 데이터 파이프라인:
- daily_reflection → 개인 컨디션 패턴 파악
- attempt_errors → 오답 원자 데이터
- error_patterns → 약점 패턴 분류
- topic_progress → 학습 진도
- 교차 분석 → 컨디션 × 오답률 × 복습 완료율

단기: 이번 주 방해 요인 기반 복습 추천
중기: 요일별 취약 패턴 분석
장기: 야근 다음날 특정 토픽 오답률 등 개인 맞춤 인사이트

## 8. 슬래시 커맨드 원칙
- /go, /re 등 커맨드는 시스템 프롬프트에 명시적으로 정의
- 커맨드 거부 응답 절대 금지 — 커맨드 감지 시 무조건 정해진 포맷으로 실행
- 커맨드 정의 변경 시 SSOT 파일(prompts/)만 수정, 인라인 중복 작성 금지

## 9. professor_ssot.ts 개념 추가 규칙
professor_ssot.ts에 새 개념 추가할 때 반드시 아래 구조 사용:
```
// [topic_id] 토픽명 — 한 줄 핵심
// RULE    : 판단 기준 또는 공식
// TRIGGER : 이 단어 보이면 이 규칙 적용
// TRAP    : 함정 포인트 (없으면 생략)
// EXAMPLE : 숫자 예시 (있을 때만)
```

topic_id 형식: [카테고리_번호] (예: INT_001, REV_001)
카테고리: TBS/PPE/INT/LEASE/REV/INV/TAX/EPS/INVEST/EQUITY/CF/CHANGE/CONSOL/FV/NFP/PART/VAL/CONT/INTANG/SW/ANNUITY
