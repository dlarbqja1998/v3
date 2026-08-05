# 학식 고도화 구현 계획

> **에이전트 작업자용:** 작업별 구현 시 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 각 단계는 체크박스로 추적한다.

**목표:** 진리관·교직원 식단을 메뉴 단위로 저장하고, 푸드코트 정적 메뉴와 익명 평가를 한 화면에서 제공한다.

**구조:** 크롤러의 주간 원본 식단은 기존 KV 캐시를 유지한다. DB에는 반복 음식인 `menu_items`, 날짜·식사별 제공 기록인 `menu_offerings`, 사용자 반응인 `menu_votes`를 분리해 저장한다. 화면은 제공 기록에 오늘/역대 통계와 사용자의 평가를 합쳐 표시한다.

**기술:** SvelteKit 2, Svelte 5, TypeScript, Drizzle ORM, Neon PostgreSQL, Cloudflare KV, Vitest

## 전역 제약

- 사용자에게 보이는 문구와 문서는 한국어로 작성한다.
- 평가 대상은 메인 메뉴와 국이다. 밥, 김치, 깍두기, 단무지, 나물, 샐러드, 음료, 후식, 소스는 제외한다.
- 평가는 해당 식사 시작 시각부터 3일 뒤 자정(Asia/Seoul)까지 가능하다.
- 동일한 익명 식별자는 같은 메뉴 제공 회차에 좋아요 또는 싫어요 하나만 남길 수 있고, 선택은 변경할 수 있다.
- 크롤링 실패 또는 공식 식단 미등록 시 `이번 주 식단이 아직 업데이트되지 않았어요.`를 표시한다.
- 푸드코트 품절 기능은 구현하지 않는다.

---

## 파일 구조

- `src/lib/domain/cafeteria-feedback.ts`: 메뉴 식별, 평가 대상 판별, 평가 가능 기간을 계산하는 순수 함수와 타입
- `src/lib/domain/cafeterias.ts`: 푸드코트 업체·정적 메뉴 데이터
- `src/lib/domain/places.ts`: 화면에서 사용하는 메뉴 및 평가 타입
- `src/lib/server/db/schema.ts`: 메뉴 항목, 제공 회차, 평가 테이블
- `src/lib/server/cafeteria-sync.ts`: 주간 크롤링 결과를 DB 메뉴 제공 회차로 upsert
- `src/lib/server/cafeteria-feedback.ts`: 화면용 식단·통계 조회와 평가 upsert
- `src/routes/api/refresh-menu/+server.ts`: 강제 새로고침 시 KV 갱신 뒤 DB 동기화
- `src/routes/api/cafeteria/votes/+server.ts`: 익명 식별자 쿠키 발급 및 평가 저장
- `src/routes/+page.server.ts`: 식단과 통계가 합쳐진 홈 데이터 로드
- `src/routes/+page.svelte`: 식당 탭, 식사 구획, 메뉴별 오늘/역대 반응, 평가 버튼
- `src/lib/server/**/*.test.ts`, `src/lib/domain/**/*.test.ts`: 순수 규칙과 저장 동작 테스트

## 작업 1: 테스트 기반과 메뉴 판별 규칙

**파일:**
- 수정: `package.json`, `package-lock.json`
- 생성: `src/lib/domain/cafeteria-feedback.ts`
- 생성: `src/lib/domain/cafeteria-feedback.test.ts`

- [ ] Vitest를 개발 의존성으로 추가하고 `npm run test`를 `vitest run`으로 정의한다.
- [ ] 실패 테스트를 작성한다. `제육볶음`, `된장국`, `비빔밥`은 평가 대상이고 `쌀밥`, `김치`, `샐러드`는 제외되는지 확인한다.
- [ ] `normalizeMenuName`, `isVotableMenu`, `getVoteWindow`을 구현한다.
- [ ] `npm run test -- cafeteria-feedback`로 통과를 확인한다.
- [ ] 커밋한다: `test: add cafeteria menu classification rules`.

## 작업 2: 메뉴·제공 회차·평가 스키마

**파일:**
- 수정: `src/lib/server/db/schema.ts`
- 생성: `drizzle/0001_cafeteria_feedback.sql`
- 수정: `drizzle/meta/_journal.json`, `drizzle/meta/0001_snapshot.json`

- [ ] 실패 테스트에서 제공 회차의 고유 키가 `식당 코드 + 메뉴 날짜 + 식사 구분 + 메뉴 항목`임을 검증한다.
- [ ] 다음 테이블을 추가한다.
  - `cafeteria_menu_items`: `id`, `cafeteria_code`, `normalized_name`, `display_name`, `created_at`; `cafeteria_code + normalized_name` 유일
  - `cafeteria_menu_offerings`: `id`, `menu_item_id`, `cafeteria_code`, `menu_date`, `meal_type`, `menu_section`, `display_name`, `is_votable`, `source`, `created_at`, `updated_at`; `menu_item_id + menu_date + meal_type + menu_section` 유일
  - `cafeteria_menu_votes`: `id`, `offering_id`, `voter_hash`, `reaction`, `created_at`, `updated_at`; `offering_id + voter_hash` 유일
- [ ] Drizzle 마이그레이션을 생성하고 SQL의 고유 제약 및 외래 키를 검토한다.
- [ ] `npm run check`와 `npm run db:generate`를 실행한다.
- [ ] 커밋한다: `feat: add cafeteria feedback schema`.

## 작업 3: 크롤링 결과 DB 동기화

**파일:**
- 생성: `src/lib/server/cafeteria-sync.ts`
- 생성: `src/lib/server/cafeteria-sync.test.ts`
- 수정: `src/lib/server/cafeteria-cache.ts`
- 수정: `src/routes/api/refresh-menu/+server.ts`

- [ ] 실패 테스트를 작성한다. 동일 주간 식단을 두 번 동기화해도 제공 회차가 중복 생성되지 않고, 메뉴가 재등장한 다른 날짜에는 새 제공 회차가 생성되는지 검증한다.
- [ ] 진리관의 `breakfast`, `korean`, `special`, `snack`, `dinner`와 교직원의 `lunch`, `dinner`를 평탄화한다. 식사 시간 판정에는 `breakfast`, `lunch`, `dinner`를 사용하고, `korean`, `special`, `snack`은 `lunch`와 원본 구획을 함께 저장한다.
- [ ] 메뉴 항목과 제공 회차를 upsert한다. 기존 제공 회차 및 평가 기록은 삭제하지 않는다.
- [ ] 새 주간 식단을 성공적으로 크롤링한 경우에만 DB 동기화를 호출한다. 동기화 실패는 캐시 갱신을 취소하지 않고 서버 로그로 남긴다.
- [ ] `npm run test -- cafeteria-sync`와 `npm run check`를 실행한다.
- [ ] 커밋한다: `feat: persist crawled cafeteria offerings`.

## 작업 4: 푸드코트 정적 메뉴와 화면용 조회 모델

**파일:**
- 수정: `src/lib/domain/cafeterias.ts`
- 수정: `src/lib/domain/places.ts`
- 생성: `src/lib/server/cafeteria-feedback.ts`
- 생성: `src/lib/server/cafeteria-feedback.test.ts`
- 수정: `src/routes/+page.server.ts`

- [ ] 실패 테스트를 작성한다. 푸드코트 메뉴는 평가 대상이며 가격을 보존하고, 반응이 없는 메뉴는 오늘·역대 집계를 모두 0으로 반환하는지 검증한다.
- [ ] `staticFoodCourtVendors`를 `id`, `name`, `menus: [{ id, name, price }]` 구조로 바꾸고 예시 메뉴를 넣는다.
- [ ] DB 제공 회차와 정적 푸드코트 메뉴를 같은 화면 모델로 변환한다. 각 평가 대상 메뉴에는 오늘 좋아요·싫어요, 역대 좋아요·싫어요, 현재 사용자의 반응을 포함한다.
- [ ] 표본이 3개 미만이면 퍼센트 대신 평가 수를 우선 표기할 수 있도록 `totalVotes`를 반환한다.
- [ ] 식단을 찾지 못하면 홈 데이터에 `menuStatus: 'unavailable'`을 전달한다.
- [ ] `npm run test -- cafeteria-feedback`와 `npm run check`를 실행한다.
- [ ] 커밋한다: `feat: load cafeteria menu feedback data`.

## 작업 5: 익명 평가 API와 기간 제한

**파일:**
- 생성: `src/routes/api/cafeteria/votes/+server.ts`
- 생성: `src/routes/api/cafeteria/votes/+server.test.ts`
- 수정: `src/lib/server/cafeteria-feedback.ts`

- [ ] 실패 테스트를 작성한다. 첫 요청은 익명 UUID 쿠키를 발급하고, 같은 제공 회차의 반응은 upsert하며, 식사 시작 전 또는 3일 경과 후 요청은 403을 반환하는지 검증한다.
- [ ] `cafeteria_voter` 쿠키를 `HttpOnly`, `Secure`, `SameSite=Lax`, 1년 만료로 발급한다. DB에는 원문 UUID가 아닌 SHA-256 해시만 저장한다.
- [ ] 요청 본문은 `offeringId`와 `reaction: 'like' | 'dislike'`만 허용한다. 제공 회차가 평가 대상이 아니면 400을 반환한다.
- [ ] 식사 시작 시각은 조식 08:00, 중식 11:30, 석식 17:00으로 고정하고 Asia/Seoul 기준으로 검사한다.
- [ ] 요청당 1초의 단순 중복 방지와 유효성 검사를 추가한다.
- [ ] `npm run test -- votes`와 `npm run check`를 실행한다.
- [ ] 커밋한다: `feat: add anonymous cafeteria votes`.

## 작업 6: 학식 화면 고도화

**파일:**
- 수정: `src/routes/+page.svelte`
- 수정: `src/app.css` (필요한 경우만)

- [ ] 평가 카드용 화면 모델을 사용하는 실패 컴포넌트 테스트 또는 렌더링 테스트를 추가한다.
- [ ] 식당을 진리관, 교직원, 푸드코트 탭으로 표시한다. 기존 가로 스와이프는 유지하되 탭 클릭과 동기화한다.
- [ ] 조식, 중식, 석식 구획 안에서 모든 메뉴를 표시하고, 평가 대상 메뉴와 국에만 아이콘 평가 버튼을 표시한다.
- [ ] 각 평가 대상 메뉴 아래에 오늘과 역대 통계를 두 줄로 표시한다. 투표 3개 미만은 `평가 N개`를 먼저 표시한다.
- [ ] 평가 가능 전에는 비활성 버튼과 안내 문구를 표시한다. 평가 요청 성공 후 해당 메뉴 수치와 선택 상태를 즉시 갱신한다.
- [ ] 식단 미등록 또는 크롤링 실패 시 `이번 주 식단이 아직 업데이트되지 않았어요.`를 표시한다.
- [ ] 모바일과 데스크톱에서 버튼, 텍스트, 스크롤이 겹치지 않는지 확인한다.
- [ ] `npm run check`와 `npm run build`를 실행한다.
- [ ] 커밋한다: `feat: show cafeteria menu feedback`.

## 작업 7: 최종 검증

**파일:**
- 수정 없음

- [ ] `npm run test`를 실행한다.
- [ ] `npm run check`를 실행한다.
- [ ] `npm run build`를 실행한다.
- [ ] 새 DB 마이그레이션 SQL을 검토한다.
- [ ] 로컬 개발 서버에서 진리관, 교직원, 푸드코트 전환과 평가 버튼 상태를 확인한다.
- [ ] 변경 사항을 하나의 최종 커밋으로 정리하지 않고, 앞선 작업별 커밋 상태를 유지한다.
