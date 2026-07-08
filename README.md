# 골라바유 v3

고려대 세종 학생을 위한 네이버 지도 기반 로컬 생활 플랫폼입니다. v3는 기존 v2 운영 코드와 분리된 새 SvelteKit 앱으로 시작합니다.

## 현재 상태

- SvelteKit + TypeScript 최소 앱 생성
- 모바일 우선 지도 홈 화면 초안 구현
- `places`, `zones`, `categories`, `cafeteria`, `shuttle` seed 데이터 구성
- 지도 제공자 타입 경계와 `NaverMapProvider` 자리 마련
- PostHog 핵심 이벤트 이름 정리
- API route 초안 구성

## 개발 실행

```sh
npm run dev
```

## 확인 명령

```sh
npm run check
npm run build
```

## Cloudflare Workers 배포

Cloudflare Workers & Pages에서 GitHub 저장소를 연결할 때는 다음 값을 사용합니다.

```txt
Project name: v3
Build command: npm run build
Deploy command: npx wrangler deploy
```

Workers 설정은 `wrangler.jsonc`에 둡니다.

현재 v3 베타 배포 URL:

```txt
https://v3.dlarbqja1998.workers.dev
```

카카오 로그인 redirect URI, 네이버 지도 허용 도메인, `AUTH_URL`은 이 URL을 기준으로 먼저 설정합니다.

## 운영 리소스 연결 전제

사용자가 새 Cloudflare 프로젝트와 새 Neon 프로젝트를 만든 뒤, 다음 단계에서 실제 환경변수와 Drizzle 스키마를 연결합니다.

값 자체는 문서에 적지 않고, `.env.example`에는 키 이름과 설명만 둡니다.

## Neon DB 작업

로컬 `.env`에 `DATABASE_URL`을 넣은 뒤 실행합니다.

```sh
npm run db:push
npm run db:seed
```

Cloudflare에는 같은 값을 Workers 환경변수 `DATABASE_URL`로 등록합니다.
