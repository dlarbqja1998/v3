# 골라바유 v3 진행 기록

## 완료

1. `C:\v3\v3` 폴더에 새 SvelteKit 앱을 생성했다.
2. npm 의존성 설치를 완료했다.
3. 기존 v2와 분리되는 v3 전용 폴더 구조를 시작했다.
4. 첫 화면을 지도 기반 생활 홈 형태로 교체했다.
5. seed 데이터 기반으로 식당, 학식, 셔틀 정류장 핀을 보여주도록 했다.
6. API route 초안을 만들었다.
7. PostHog 이벤트 이름을 정리했다.
8. Cloudflare Workers 배포를 전제로 `@sveltejs/adapter-cloudflare`를 연결했다.
9. 비밀값 없이 키 이름만 담은 `.env.example`을 추가했다.
10. Cloudflare Workers 배포용 `wrangler.jsonc`와 `deploy` 스크립트를 추가했다.
11. Drizzle, Neon serverless, Drizzle Kit, seed 스크립트 구성을 추가했다.

## 다음에 이어서 할 일

1. 사용자가 새 Cloudflare/Neon 정보를 가져오면 `.env.example`을 확정한다.
2. Drizzle과 Neon 연결 패키지를 설치한다.
3. `places` 중심 DB 스키마를 코드로 작성한다.
4. 네이버 지도 API 키가 준비되면 실제 SDK 로더를 연결한다.
5. 카카오 로그인과 온보딩 흐름을 v3 기준으로 구현한다.
