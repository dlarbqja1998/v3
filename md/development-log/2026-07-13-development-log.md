# 2026년 7월 13일 개발 기록

## 개요

이 문서는 2026년 7월 13일 대화 중 실제 코드에 반영한 변경 사항을 정리한 개발 기록이다. 주요 작업은 골라바유 전역 폰트 적용, 네이버 지도 초기 카메라 설정 조정, 학교 주변 생활권 제한, 서비스명 오기 수정, SSR 500 에러 수정이다.

## 변경 파일

- `src/app.css`
- `src/routes/+page.svelte`
- `src/lib/map/NaverMap.svelte`
- `static/fonts/LINESeedKR-Rg.woff2`
- `static/fonts/LINESeedKR-Bd.woff2`

## 1. LINE Seed Sans KR 폰트 적용

### 작업 내용

기존 전역 폰트는 `Inter`, `system-ui`, `Segoe UI` 중심으로 설정되어 있었다. 골라바유의 한글 서비스 톤에 맞게 `LINE Seed Sans KR`을 자체 호스팅 방식으로 적용했다.

폰트 파일은 `static/fonts` 폴더에 배치했다.

```txt
static
  fonts
    LINESeedKR-Rg.woff2
    LINESeedKR-Bd.woff2
```

`src/app.css`에는 `@font-face`를 추가했다.

```css
@font-face {
	font-family: 'LineSeed';
	src: url('/fonts/LINESeedKR-Rg.woff2') format('woff2');
	font-weight: 400;
	font-display: swap;
}

@font-face {
	font-family: 'LineSeed';
	src: url('/fonts/LINESeedKR-Bd.woff2') format('woff2');
	font-weight: 700;
	font-display: swap;
}
```

전역 `font-family`는 다음 순서로 변경했다.

```css
font-family:
	'LineSeed', 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', Arial, sans-serif;
```

### 의도

- 한글과 영문, 숫자가 모두 안정적으로 보이도록 한다.
- CDN 의존을 줄이고 앱 배포 및 웹뷰 래핑 시에도 폰트가 안정적으로 로드되도록 한다.
- `font-display: swap`으로 폰트 로딩 중 텍스트 표시 지연을 줄인다.

## 2. 불필요한 폰트 원본 정리

### 작업 내용

사용자가 `static` 폴더에 넣어둔 LINE Seed KR 원본 폴더에서 웹에 필요한 `woff2` 파일만 추려 `static/fonts`로 이동했다.

남긴 파일은 다음 2개다.

- `LINESeedKR-Rg.woff2`
- `LINESeedKR-Bd.woff2`

정리한 항목은 다음과 같다.

- `OTF`
- `TTF`
- `eot`
- `woff`
- `Th` 얇은 굵기 파일
- `.DS_Store`
- 원본 `LINE_SeedKR_2023.09.06` 폴더

### 의도

- 배포 산출물에 불필요한 폰트 파일이 포함되지 않게 한다.
- 실제 UI에서 사용하는 400, 700 굵기만 유지해 용량을 줄인다.

## 3. 서비스명 오기 수정

### 작업 내용

`src/routes/+page.svelte`에 남아 있던 잘못된 서비스명 `골라바우`를 `골라바유`로 수정했다.

수정 위치는 다음과 같다.

- `<title>골라바유 v3</title>`
- `aria-label="골라바유 v3 지도 홈"`

### 의도

- 서비스명을 전 구간에서 `골라바유`로 통일한다.
- 문서 제목과 접근성 라벨에서 잘못된 명칭이 노출되지 않게 한다.

## 4. 네이버 지도 초기 카메라 설정 변경

### 작업 내용

`src/lib/map/NaverMap.svelte`에서 지도 초기 중심과 줌 설정을 변경했다.

기존 설정은 고려대 세종캠퍼스 근처 좌표와 `zoom: 15`, `minZoom: 13`을 사용했다. 변경 후에는 사용자가 지정한 좌표를 기준으로 초기 화면을 더 확대해서 보여주도록 했다.

```ts
const initialTarget = {
	latitude: 36.608634852584125,
	longitude: 127.28902073594871
};

const initialZoom = 16;
const minZoom = 15;
const maxZoom = 19;
```

또한 지정 좌표가 화면 중앙보다 약 5px 아래에 보이도록 지도 중심 좌표를 약간 북쪽으로 보정했다.

```ts
const fivePixelLatitudeOffset = 0.000086;

const initialCenter = {
	latitude: initialTarget.latitude + fivePixelLatitudeOffset,
	longitude: initialTarget.longitude
};
```

### 의도

- 첫 진입 시 학교 주변 로컬 서비스처럼 보이게 한다.
- 전국 단위 지도가 아니라 고려대 세종/조치원 생활권 중심의 지도로 인식되게 한다.
- 기존보다 한 단계 확대된 상태로 시작해 불필요한 넓은 영역 노출을 줄인다.

## 5. 학교 주변 생활권 제한 추가

### 작업 내용

지도 중심이 학교 주변 생활권 밖으로 벗어나지 않도록 `serviceBounds`를 추가했다.

```ts
const serviceBounds = {
	south: 36.5965,
	west: 127.2765,
	north: 36.6215,
	east: 127.3065
};
```

지도 이벤트를 등록해 드래그, 줌 변경, idle 시점에 지도 중심을 검사한다.

```ts
mapListeners = [
	naver.maps.Event.addListener(map, 'idle', keepMapInServiceArea),
	naver.maps.Event.addListener(map, 'dragend', keepMapInServiceArea),
	naver.maps.Event.addListener(map, 'zoom_changed', keepZoomInServiceArea)
];
```

중심 좌표가 범위를 벗어나면 가장 가까운 경계 안으로 되돌린다.

```ts
const nextLatitude = clamp(center.lat(), serviceBounds.south, serviceBounds.north);
const nextLongitude = clamp(center.lng(), serviceBounds.west, serviceBounds.east);
```

### 의도

- 골라바유가 학교 주변 로컬 플랫폼이라는 인상을 강화한다.
- 사용자가 지도를 과도하게 멀리 이동하거나 줌아웃해 전국 단위 지도로 사용하는 흐름을 줄인다.
- 불필요한 지도 타일 요청을 줄이는 방향으로 UX를 제한한다.

## 6. 지도 이벤트 리스너 정리 추가

### 작업 내용

앱으로 감쌀 가능성을 고려해 네이버 지도 이벤트 리스너를 `onDestroy`에서 정리하도록 했다.

```ts
onDestroy(() => {
	clearMapListeners();
	clearMarkers();
	map = null;
});
```

정리 함수는 다음과 같다.

```ts
function clearMapListeners() {
	if (typeof window === 'undefined') return;

	const naver = window.naver;
	if (!naver) return;

	for (const listener of mapListeners) {
		(naver.maps.Event as any).removeListener(listener);
	}
	mapListeners = [];
}
```

### 의도

- 웹뷰/앱 래핑 환경에서 화면 전환 후 이벤트 리스너가 남는 문제를 줄인다.
- 지도 컴포넌트가 언마운트될 때 마커와 지도 이벤트를 함께 정리한다.

## 7. SSR 500 에러 수정

### 발생 문제

지도 이벤트 리스너 정리 함수를 추가한 뒤 `/` 진입 시 500 에러가 발생했다.

원인은 서버 렌더링 환경에서 `window`가 존재하지 않는데, `onDestroy` 흐름에서 `clearMapListeners()`가 `window.naver`를 참조했기 때문이다.

에러 핵심은 다음과 같았다.

```txt
ReferenceError: window is not defined
```

### 수정 내용

`clearMapListeners()` 맨 앞에 브라우저 환경인지 확인하는 가드를 추가했다.

```ts
if (typeof window === 'undefined') return;
```

### 결과

- dev 서버에서 `/` 요청 결과가 `500`에서 `200`으로 복구됐다.
- `npm run check` 결과 에러와 경고가 없었다.

## 8. 마커 라벨 수정

### 작업 내용

학식 또는 식당 계열 카테고리의 마커 라벨을 기존 `학`에서 `밥`으로 변경했다.

```ts
if (categorySlug === 'cafeteria') return '밥';
```

### 의도

- 사용자에게 더 직관적인 음식/식사 맥락을 전달한다.
- 골라바유의 친근한 톤에 맞춘다.

## 검증

다음 검증을 수행했다.

```bash
npm run check
```

결과:

```txt
svelte-check found 0 errors and 0 warnings
```

500 에러 수정 후 dev 서버에서 `/` 요청도 확인했다.

```txt
STATUS=200
```

## 남은 주의사항

- 네이버 지도 Client ID는 프론트에서 사용하는 성격의 키이므로 코드에 직접 하드코딩하지 않고 기존처럼 환경 변수에서 전달한다.
- 실제 운영 전 네이버 클라우드 콘솔에서 허용 도메인 제한을 반드시 설정해야 한다.
- 앱으로 감쌀 경우 웹뷰 도메인, 앱 패키지, 딥링크/리다이렉트 정책을 별도로 점검해야 한다.
- 현재 `serviceBounds` 값은 1차 범위이므로 실제 학교 주변 사용성 테스트 후 조정할 수 있다.
- 상단 헤더, 검색 영역, 카테고리 칩, 하단 바텀시트의 화면 구조는 아직 확정 전이며 다음 디자인 작업에서 정리해야 한다.
