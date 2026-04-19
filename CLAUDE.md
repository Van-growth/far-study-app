# FAR Study App — Claude 작업 규칙

## Git 자동 커밋/푸시

작업 완료 후 매번 묻지 말고 즉시 실행:

1. 변경된 파일 `git add`
2. 한국어 커밋 메시지로 `git commit` (Conventional Commits 형식: `feat/fix/chore/...`)
3. `git push origin main`

확인이 필요한 경우(예: 대규모 삭제, force push)만 예외적으로 먼저 물어본다.

## Render 자동 배포

git push 완료 후 아래 두 서비스를 즉시 배포 트리거:

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
