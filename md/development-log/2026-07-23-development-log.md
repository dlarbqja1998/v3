# 2026-07-23 개발 로그

## 변경 사항

- 학식 고도화 계획을 수립하고 `md/planning/`에 계획 문서를 정리했다.
- Vitest를 추가하고 학식 메뉴 판별, 평가 가능 기간, 오늘/역대 반응 집계, 크롤링 메뉴 평탄화, 푸드코트 메뉴, DB 동기화 필요 여부를 테스트로 고정했다.
- 반복 음식, 날짜별 메뉴 제공 회차, 사용자 평가를 분리하는 학식 평가 DB 스키마와 Drizzle 마이그레이션을 추가했다.
- 진리관·교직원 공식 식단을 날짜·식사·메뉴별로 DB에 저장하고, 같은 메뉴의 과거 평가를 누적할 수 있게 했다.
- 푸드코트 정적 메뉴를 업체별 메뉴명·가격 구조로 변경하고 예시 메뉴를 추가했다.
- 익명 식별자 쿠키를 사용해 메뉴 제공 회차별로 좋아요 또는 아쉬워요 하나를 남기고 변경할 수 있게 했다.
- 메인 메뉴와 국에만 평가 버튼을 표시하고, 오늘 및 역대 반응 수를 학식 화면에 표시했다.
- KV 캐시가 이미 신선한 경우에도 DB 메뉴 제공 회차가 부족하면 현재 주 식단을 동기화하도록 보완했다.
- 프로젝트 루트 `AGENTS.md`에 Git 커밋 승인, 제품 목표, 앱 WebView 출시 고려, 보고 방식을 추가했다.

## 운영 메모

- DB 마이그레이션 적용 후 교직원 메뉴 제공 회차 38개와 푸드코트 제공 회차 6개가 저장된 것을 확인했다.
- 기존 Vite 개발 서버가 `.svelte-kit/cloudflare`를 점유하면 Cloudflare 어댑터의 빌드 마지막 정리 단계가 `EBUSY`로 실패할 수 있다. 개발 서버를 중지한 뒤 빌드하면 된다.

## 검증

- `npm run test` 실행: 17개 테스트 통과
- `npm run check` 실행: 오류 0건, 경고 0건
- `npm run build` 실행: Svelte 컴파일은 완료됐고, 실행 중인 개발 서버의 파일 잠금으로 Cloudflare 어댑터 정리 단계에서만 실패

## 커밋 기록

- `274f0d4 test: add cafeteria menu classification rules`
- `34a1aca feat: add cafeteria feedback schema`
- `f0c050b feat: persist crawled cafeteria offerings`
- `91d3be3 feat: show cafeteria menu feedback`
- `7f4492d fix: sync cached cafeteria menus to database`
