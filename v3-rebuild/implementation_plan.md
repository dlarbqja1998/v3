# 골라바유 v3 실전 아키텍처 설계

## 1. 전체 아키텍처

```txt
사용자
  ↓
SvelteKit 모바일 웹/PWA
  ↓
네이버 지도 기반 생활 홈
  ↓
SvelteKit Server Routes on Cloudflare Workers
  ↓
새 Neon Postgres 프로젝트
  ↓
places / zones / categories / cafeteria / shuttle / users / meetups / reviews

보조 시스템
- PostHog: 사용자 행동 분석
- Cloudflare R2: 이미지 저장
- Cloudflare KV: 가벼운 캐시
- Capacitor: 앱 래핑
- 네이버 지도 API: 지도 렌더링과 장소 검증 보조
```

## 2. 운영 분리 전략

v2와 v3는 같은 서비스 이름을 공유하지만 운영 단위는 분리한다.

```txt
v2
- 기존 코드
- 기존 Cloudflare 프로젝트
- 기존 Neon DB
- 기존 사용자 서비스 유지

v3
- 새 폴더
- 새 Cloudflare 프로젝트
- 새 Neon 프로젝트
- 새 DB 스키마
- 새 네이버 지도 설정
- 새 배포 도메인 또는 베타 서브도메인
```

이 방식은 비용이 정확히 2배가 되는 구조라기보다 사용량이 분리되는 구조다. 현재 Neon compute 시간이 커지고 있으므로 v3는 새 프로젝트에서 compute 사용량을 따로 관찰한다.

## 3. 프론트엔드 구조

SvelteKit을 유지한다. 첫 출시는 모바일 웹/PWA이며, 이후 Capacitor 앱으로 감싼다.

권장 폴더 구조:

```txt
src/lib/map/
- providers/naver.ts
- providers/types.ts
- layers/place-layer.ts
- layers/shuttle-layer.ts
- layers/zone-layer.ts

src/lib/analytics/
- posthog.client.ts
- events.ts

src/lib/domain/
- places.ts
- zones.ts
- cafeteria.ts
- shuttle.ts
- meetup.ts

src/routes/
- +page.svelte
- +page.server.ts
- api/map/places/+server.ts
- api/map/zones/+server.ts
- api/shuttle/next/+server.ts
- api/cafeteria/today/+server.ts
```

## 4. 지도 설계

네이버 지도를 기본 제공자로 사용한다. 단, 화면 코드가 네이버 SDK에 직접 의존하지 않게 지도 제공자 레이어를 둔다.

```txt
MapProvider
- init(container, options)
- destroy()
- moveTo(center, zoom)
- addMarker(marker)
- removeMarker(markerId)
- drawPolygon(polygon)
- clearLayer(layerId)
- onIdle(callback)
- onMarkerClick(callback)
```

처음 구현은 `NaverMapProvider`만 만든다. 카카오 지도 호환은 당장 구현하지 않아도 되지만, 타입 경계는 유지한다.

## 5. DB 설계

v3는 `restaurants` 중심이 아니라 `places` 중심으로 설계한다. 식당, 카페, 술집, 학식, 셔틀 정류장, 시설, 이벤트 핀이 모두 장소가 될 수 있다.

### places

```txt
places
- id
- type
- name
- category_id
- zone_id
- latitude
- longitude
- address
- road_address
- phone
- description
- is_visible
- display_priority
- created_at
- updated_at
```

### place_categories

```txt
place_categories
- id
- name
- slug
- icon
- color
- display_order
- is_visible
```

### zones

```txt
zones
- id
- name
- slug
- center_latitude
- center_longitude
- polygon
- display_order
- is_visible
```

### place_sources

```txt
place_sources
- id
- place_id
- provider
- provider_place_id
- provider_url
- raw_payload
- last_synced_at
```

### restaurant_profiles

```txt
restaurant_profiles
- place_id
- price_level
- opening_hours
- menu_summary
- naver_place_url
- kakao_place_url
- rating_avg
- review_count
- last_verified_at
```

### shuttle_stops

```txt
shuttle_stops
- place_id
- stop_code
- direction
- memo
```

### shuttle_schedules

```txt
shuttle_schedules
- id
- stop_id
- day_type
- departure_time
- route_name
- is_active
```

### cafeterias

```txt
cafeterias
- place_id
- name
- type
```

### cafeteria_menus

```txt
cafeteria_menus
- id
- cafeteria_id
- menu_date
- meal_type
- items
- source
- updated_at
```

## 6. 로그인과 온보딩

기존 카카오 3초 로그인과 하이브리드 온보딩 방향은 유지한다.

유지할 원칙:

1. 카카오 로그인으로 빠르게 진입한다.
2. 첫 진입 후 필요한 정보만 온보딩에서 받는다.
3. 모임 기능처럼 신뢰가 필요한 기능은 추가 프로필 완성도를 요구한다.
4. 일반 지도 탐색, 식당 보기, 학식/셔틀 확인은 낮은 진입 장벽을 유지한다.

v3에서는 카카오 앱 설정의 redirect URI를 새 도메인 기준으로 다시 등록한다.

## 7. PostHog 설계

처음부터 PostHog를 붙인다. 단, 이벤트를 많이 찍기보다 핵심 행동만 수집한다.

초기 이벤트:

```txt
view_map_home
select_zone
select_category
search_place
click_place_marker
open_place_sheet
click_place_detail
click_shuttle_marker
open_cafeteria
open_meetup
create_meetup_start
create_meetup_complete
login_success
onboarding_complete
```

수집하지 않을 정보:

```txt
이메일
전화번호
카카오 ID
인스타 ID
정확한 현재 위치 좌표
개인 연락처
민감한 사용자 프로필 원문
```

사용자 식별은 내부 사용자 ID를 그대로 노출하기보다 해시 또는 별도 분석용 ID를 사용한다.

## 8. API 설계

지도 화면은 서버에서 필요한 데이터만 가져온다.

```txt
GET /api/map/places?zone=...&category=...
GET /api/map/places?bounds=...
GET /api/map/zones
GET /api/map/place/:id
GET /api/shuttle/next?stop_id=...
GET /api/cafeteria/today
```

외부 네이버 장소 API는 사용자 조작마다 호출하지 않는다. 초기 데이터 수집, 운영자 검증, 좌표 보정 용도로만 사용한다.

## 9. 배포와 도메인

초기 개발은 Cloudflare 기본 URL로 가능하다.

실서비스 전 권장 구조:

```txt
v2 운영: golabau.com
v3 베타: beta.golabau.com
v3 API: beta.golabau.com/api
앱 출시 후: app.golabau.com 또는 golabau.com
```

도메인은 카카오 로그인, 네이버 지도 허용 도메인, PostHog, 앱 딥링크, 개인정보처리방침 URL 때문에 실서비스 전에는 고정하는 것이 좋다.

## 10. 환경변수 전략

기존 `.env`를 그대로 새 프로젝트에 복사하지 않는다. 필요한 키 이름만 가져오고 값은 v3 기준으로 재발급하거나 재설정한다.

v3에서 필요한 키:

```txt
DATABASE_URL
AUTH_KAKAO_ID
AUTH_KAKAO_SECRET
SESSION_SECRET
AUTH_URL
AUTH_TRUST_HOST
NAVER_MAP_CLIENT_ID
NAVER_MAP_CLIENT_SECRET
POSTHOG_PROJECT_TOKEN
POSTHOG_HOST
ADMIN_SECRET_KEY
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME
R2_PUBLIC_URL
PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

주의:

1. 새 Neon 프로젝트를 만들면 `DATABASE_URL`은 반드시 새 값으로 교체한다.
2. v3 도메인을 정하면 `AUTH_URL`과 카카오 redirect URI를 그 도메인으로 맞춘다.
3. 네이버 지도 키는 v3 도메인 기준으로 발급하고 허용 도메인을 제한한다.
4. 기존 `.env`에 운영 비밀값이 있으므로 새 저장소나 문서에 값 자체를 남기지 않는다.
5. `.env.example`에는 키 이름과 설명만 둔다.

## 11. 구현 순서

1. 새 v3 앱 폴더 생성
2. SvelteKit 기본 구조 정리
3. 새 Neon 프로젝트 생성
4. Drizzle v3 스키마 작성
5. 카카오 로그인과 온보딩 이식
6. 네이버 지도 SDK 로더 구현
7. `places`, `zones`, `categories` 기반 지도 홈 구현
8. 학식과 셔틀 도메인 구현
9. PostHog 이벤트 연결
10. Cloudflare 배포
11. 베타 도메인 연결
12. 앱 래핑 준비

