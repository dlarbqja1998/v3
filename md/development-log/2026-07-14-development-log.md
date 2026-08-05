# 2026년 7월 14일 개발 기록

## 개요

이 문서는 2026년 7월 14일 진행한 골라바유 v3 개발 내용을 정리한 기록이다. 오늘의 핵심 작업은 메인 지도 화면에 학식 바텀시트를 붙이고, v2에서 사용하던 학식 크롤링/캐시 구조를 v3로 이식한 것이다. 추가로 학식 모드에서 지도 상단 영역에 현재 선택한 식당 핀만 보이도록 조정했고, 팀원 공유용 Cloudflare Quick Tunnel 사용법도 확인했다.

오늘 작업은 커밋 `4bb835e Add cafeteria bottom sheet and menu cache`로 `origin/main`에 push했다.

## 변경 파일

- `package.json`
- `package-lock.json`
- `wrangler.jsonc`
- `worker/index.ts`
- `src/app.d.ts`
- `src/lib/domain/places.ts`
- `src/lib/domain/cafeterias.ts`
- `src/lib/map/NaverMap.svelte`
- `src/lib/server/db/queries.ts`
- `src/lib/server/cafeteria-cache.ts`
- `src/lib/server/cafeteria-scraper.ts`
- `src/routes/+page.server.ts`
- `src/routes/+page.svelte`
- `src/routes/api/cafeteria/today/+server.ts`
- `src/routes/api/refresh-menu/+server.ts`

## 1. 학식 데이터 방향 정리

### 결정 내용

학식 메뉴 데이터는 DB에 저장하지 않고 v2와 동일하게 크롤링 결과를 캐시해서 사용하기로 했다.

진리관 식당과 교직원 식당은 학교 식단 페이지에서 주간 식단을 크롤링한다. 학관 푸드코트는 메뉴가 고정형이므로 일단 코드 상수로 관리하고, 메뉴 목록은 비워둔 상태로 화면에 `준비 중`으로 표시한다.

### 이유

- 진리관/교직원 메뉴는 매주 바뀌므로 DB에 직접 쌓는 것보다 주간 캐시가 단순하다.
- Cloudflare KV를 쓰면 페이지 요청마다 학교 페이지를 때리지 않아도 된다.
- 학관 푸드코트는 운영자 수정 기능이 생기기 전까지 DB가 꼭 필요하지 않다.
- 나중에 평점 기능을 붙일 때는 메뉴 표시 데이터와 별도 테이블을 두는 것이 더 낫다.

## 2. 학식 3곳 좌표와 도메인 데이터 추가

### 작업 내용

`src/lib/domain/cafeterias.ts`를 추가해 학식 3곳을 고정 장소 데이터로 정의했다.

- 진리관 식당
  - 위도: `36.61121812587927`
  - 경도: `127.28464868222916`
- 교직원 식당
  - 위도: `36.610507457052316`
  - 경도: `127.28507641138197`
- 학관 푸드코트
  - 위도: `36.610478424045624`
  - 경도: `127.2896423876288`

학관 푸드코트 좌표는 입력값이 `26.610...`으로 들어왔으나 캠퍼스 좌표 흐름상 오타로 판단해 `36.610...`으로 보정했다.

푸드코트 업체는 다음 3개로 등록했다.

- 바비든든
- 비비고고
- 값찌개

현재 메뉴 목록은 공란이다.

## 3. 학식 타입 확장

### 작업 내용

`src/lib/domain/places.ts`에 학식 메뉴 관련 타입을 추가했다.

- `MenuDayKey`
- `DailyMenu`
- `WeeklyMenu`
- `CafeteriaMeal`
- `CafeteriaPanelItem`

### 평점 기능 대비

나중에 별점 기능을 붙일 수 있도록 `CafeteriaMeal`에 다음 식별 구조를 고려해 두었다.

```ts
ratingTarget: {
	cafeteriaId: string;
	mealType: string;
	menuDate?: string;
}
```

이 구조를 쓰면 다음 두 가지 평점 모델을 분리할 수 있다.

- 식당 단위 평점
- 특정 날짜, 특정 끼니, 특정 메뉴 단위 평점

## 4. v2 학식 크롤러 이식

### 작업 내용

`src/lib/server/cafeteria-scraper.ts`를 추가했다. v2의 `scraper.ts` 로직을 v3에 맞게 이식했다.

크롤링 대상 URL은 다음과 같다.

```txt
https://fund.korea.ac.kr/koreaSejong/8028/subview.do
```

크롤러는 월요일부터 금요일까지의 주간 식단을 읽어 다음 구조로 정리한다.

진리관 식당:

- 조식
- 한식
- 일품
- 분식
- 석식

교직원 식당:

- 중식
- 석식

교직원 식당은 현재 주로 중식만 나오는 것으로 보이나, 석식이 있을 가능성을 열어두고 파싱 구조를 확장했다.

## 5. Cloudflare KV 캐시 이식

### 작업 내용

`src/lib/server/cafeteria-cache.ts`를 추가했다. v2의 `menu-cache.ts` 흐름을 v3에 맞게 가져왔다.

사용하는 KV 키는 다음과 같다.

```ts
export const MENU_CACHE_KEY = 'cafeteria_menu_weekly';
export const MENU_META_KEY = 'cafeteria_menu_weekly_meta';
```

캐시 정책은 다음과 같다.

- KV에 이번 주 메뉴가 있으면 그대로 반환한다.
- KV가 오래됐으면 stale 데이터를 먼저 반환하고 백그라운드 갱신을 시도한다.
- KV가 없고 로컬 개발 환경이면 직접 크롤링해서 화면을 확인할 수 있게 했다.
- 토요일/일요일, 월요일 점심 전에는 메뉴를 숨기는 v2 흐름을 유지했다.

## 6. 월요일 크론 갱신 추가

### 작업 내용

`worker/index.ts`를 추가하고, `wrangler.jsonc`의 main 엔트리를 커스텀 워커로 변경했다.

```json
"main": "worker/index.ts"
```

크론 설정은 v2와 동일하게 가져왔다.

```json
"triggers": {
	"crons": ["*/5 2-6 * * 1"]
}
```

Cloudflare cron은 UTC 기준이므로 월요일 오전 한국 시간대에 여러 번 갱신을 시도하는 흐름이다.

KV 바인딩도 v2와 같은 이름을 사용했다.

```json
"kv_namespaces": [
	{
		"binding": "GOLABAU_CACHE",
		"id": "692a6da28f784bf2bf0179a894fda042"
	}
]
```

## 7. 학식 수동 갱신 API 추가

### 작업 내용

`src/routes/api/refresh-menu/+server.ts`를 추가했다.

관리자 시크릿을 헤더로 보내면 강제로 학식 캐시를 갱신할 수 있다.

사용 가능한 헤더는 다음과 같다.

- `x-cache-clear-secret`
- `x-admin-secret`

환경 변수는 다음 중 하나를 사용한다.

- `CACHE_CLEAR_SECRET`
- `ADMIN_SECRET_KEY`

## 8. 홈 데이터 연결

### 작업 내용

`src/routes/+page.server.ts`에서 `getTodayMenuWithRefresh(platform)`를 호출하고, 그 결과를 `getHomeData()`에 넘기도록 변경했다.

`src/lib/server/db/queries.ts`는 홈 데이터에 다음 값을 추가로 내려준다.

```ts
cafeterias: CafeteriaPanelItem[];
```

DB가 켜져 있어도 학식 3곳 핀은 항상 보이도록 `appendCafeteriaPlaces()`에서 학식 장소를 장소 목록에 합친다.

## 9. 메인 학식 바텀시트 구현

### 작업 내용

`src/routes/+page.svelte`의 하단 바텀시트를 확장했다.

홈 상태에서는 기존처럼 3개 카드가 보인다.

- 오늘 학식
- 다음 셔틀
- 모임

사용자가 `오늘 학식`을 누르면 바텀시트가 `80dvh` 높이로 확장된다.

확장된 학식 바텀시트에는 다음 UI가 들어간다.

- 현재 식당명
- 닫기 버튼
- 진리관 식당, 교직원 식당, 학관 푸드코트 좌우 스와이프 카드
- 현재 식당 위치와 연동되는 지도 핀
- 월, 화, 수, 목, 금 요일 탭
- 조식/한식/일품/분식/석식 또는 중식/석식 펼침 메뉴

진리관 식당은 기본으로 먼저 보이게 했다.

## 10. 학식 모드 지도 UI 조정

### 상단 UI 제거

학식 바텀시트를 열면 지도 위 상단의 다음 UI를 숨기도록 했다.

- `골라바유` 헤더
- 로그인 버튼
- 구역 필터
- 검색창
- 카테고리 칩

의도는 바텀시트가 올라왔을 때 위쪽 1/5 영역이 순수 지도처럼 보이게 하는 것이다.

### 현재 선택된 학식 핀만 표시

학식 모드에서는 지도에 모든 학식 핀이 뜨지 않도록 했다.

`mapPlaces`를 분리해 학식 모드에서는 현재 선택한 식당 하나만 `NaverMap`에 전달한다.

```ts
const mapPlaces = $derived(
	sheetMode === 'cafeteria' && activeCafeteria
		? data.places.filter((place) => place.id === activeCafeteria.placeId)
		: filteredPlaces
);
```

## 11. 핀 위치 보정

### 문제

바텀시트가 80% 올라오면 실제로 보이는 지도 영역은 위쪽 20%뿐이다. 기존 지도 중심 보정은 전체 화면 중앙을 기준으로 작동해서, 핀이 바텀시트 뒤로 가리거나 상단 영역 중앙에 오지 않았다.

### 수정 내용

`src/lib/map/NaverMap.svelte`에 `focusMode`를 추가했다.

```ts
focusMode?: 'default' | 'top-band';
```

학식 모드에서는 다음처럼 넘긴다.

```svelte
focusMode={sheetMode === 'cafeteria' ? 'top-band' : 'default'}
```

`top-band`에서는 핀이 전체 지도 화면의 `0.1` 위치에 오게 계산한다. 바텀시트가 80% 올라와서 지도 상단 20%만 보이므로, 그 20% 영역의 중앙은 전체 화면 기준 10% 지점이다.

핵심 수치:

```ts
const markerTargetRatio = 0.1;
const markerCenterRatio = 0.5;
const verticalShiftPixels = mapHeight * (markerCenterRatio - markerTargetRatio);
```

그 다음 현재 줌 레벨 기준으로 픽셀 이동량을 위도값으로 변환한다.

```ts
const metersPerPixel =
	(156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
const latitudeDegreesPerMeter = 1 / 111320;

return verticalShiftPixels * metersPerPixel * latitudeDegreesPerMeter;
```

지도 중심은 다음 공식으로 잡는다.

```ts
centerLat = markerLat - offset;
```

핀을 화면 위쪽에 보이게 하려면 지도 중심을 핀보다 남쪽으로 내려야 하므로 `- offset`이 맞다.

## 12. 핀 스타일 수정

### 작업 내용

처음에는 마커 안에 `밥` 라벨을 넣었으나, 학식 모드에서는 말풍선처럼 보이고 시각적으로 과해서 제거했다.

이후 마커 크기도 줄였다.

기존:

```ts
size: 44x44
marker: 42x42
border-radius: 50% 50% 50% 12px
```

변경:

```ts
size: 32x32
marker: 30x30
border-radius: 50% 50% 50% 8px
```

의도는 텍스트 없이 위치만 표시하는 더 슬림한 핀으로 보이게 하는 것이다.

## 13. 팀원 공유용 Cloudflare Quick Tunnel 확인

### 사용 방법

개발 서버를 먼저 켠다.

```powershell
npm run dev -- --host 127.0.0.1
```

다른 터미널에서 Cloudflare Tunnel을 실행한다.

```powershell
cloudflared tunnel --url http://127.0.0.1:5173
```

만약 `cloudflared` 명령어가 인식되지 않으면 설치 경로를 직접 실행한다.

```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:5173
```

오늘 확인된 Quick Tunnel 주소는 다음과 같다.

```txt
https://softball-shows-selecting-doors.trycloudflare.com
```

Quick Tunnel 주소는 터널을 다시 켜면 바뀔 수 있다.

### 유지 조건

- `npm run dev` 터미널이 켜져 있어야 한다.
- `cloudflared tunnel` 터미널이 켜져 있어야 한다.
- 데스크탑이 꺼지거나 터미널이 종료되면 팀원 접속도 끊긴다.

## 14. 의존성 추가

### 작업 내용

학식 크롤링을 위해 `cheerio`를 추가했다.

```json
"cheerio": "^1.2.0"
```

설치 후 npm이 기존 의존성 트리 기준 취약점 8개를 보고했다.

- low 4개
- moderate 4개

오늘 기능 실행과 직접 관련된 에러는 아니므로 별도 보안 정리 작업으로 남겨둔다.

## 검증

다음 명령을 여러 차례 실행했다.

```powershell
npm run check
```

결과:

```txt
svelte-check found 0 errors and 0 warnings
```

빌드도 확인했다.

```powershell
npm run build
```

결과:

```txt
✓ built
```

로컬 페이지와 학식 API 응답도 확인했다.

```txt
http://127.0.0.1:5173/
STATUS 200
```

```txt
http://127.0.0.1:5173/api/cafeteria/today
STATUS 200
```

## Git 기록

오늘 작업 커밋:

```txt
4bb835e Add cafeteria bottom sheet and menu cache
```

push 대상:

```txt
origin/main
```

커밋에 포함하지 않은 기존 작업물:

- `.env.example` 삭제 상태
- `src/app.css` 수정
- `static/fonts/` 추가 파일

위 항목들은 작업 시작 전부터 존재하던 변경으로 판단해 오늘 학식 기능 커밋에는 포함하지 않았다.

## 남은 작업

- 셔틀 기능을 지도 핀 중심 UX로 설계하고 구현해야 한다.
- 학관 푸드코트의 실제 고정 메뉴와 가격을 입력해야 한다.
- 학식 바텀시트의 카드 높이, 스와이프 감도, 핀 위치는 실제 모바일에서 추가 확인이 필요하다.
- 학식 평점 기능은 식당 단위와 날짜/메뉴 단위를 분리해서 설계해야 한다.
- Cloudflare Quick Tunnel은 임시 공유용이므로 장기 공유가 필요하면 preview 배포 또는 named tunnel을 검토해야 한다.
