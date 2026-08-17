# 앱 시작 아이콘 및 스플래시 구현 계획

> **에이전트 작업자 필수 하위 스킬:** 이 계획은 `superpowers:executing-plans`를 사용해 작업별로 실행한다. 모든 단계는 체크박스로 추적한다.

**목표:** Svelte 기본 파비콘을 호이 핀으로 교체하고, 문서 최초 진입 때만 흰색 배경 중앙에서 호이 핀이 커지는 0.8초 스플래시를 제공한다.

**구조:** 파비콘 선언은 루트 Svelte 레이아웃이 담당한다. 첫 페인트 이전의 스플래시는 `src/app.html`에 독립된 HTML·CSS·정리 스크립트로 두어 SvelteKit 클라이언트 내부 탐색과 분리한다.

**기술 스택:** SvelteKit 2, Svelte 5, TypeScript 6, Vitest 4, 표준 HTML/CSS/DOM API, Cloudflare Workers

## 전역 제약 조건

- 모든 사용자 문구, 테스트 설명, 문서는 한국어로 작성한다.
- 기존 `static/icon.png`를 수정하지 않고 파비콘과 스플래시 원본으로 재사용한다.
- 배경은 `#ffffff`, 아이콘은 약 70%에서 100%로 확대하며 전체 전환은 약 0.8초로 한다.
- SvelteKit 내부 페이지 이동에서는 스플래시를 다시 표시하지 않는다.
- `prefers-reduced-motion: reduce`에서는 확대 이동을 생략한다.
- 일반 웹과 향후 Capacitor WebView가 함께 지원하는 표준 웹 API만 사용한다.
- 기존 사용자의 수정 파일과 미추적 파일은 스테이징하거나 변경하지 않는다.
- 사용자에게서 이번 기능의 커밋, 푸시, 배포 승인을 이미 받았으므로 계획에 명시된 파일만 커밋한다.

## 파일 구성

- 생성: `src/lib/config/app-shell.test.ts` — 루트 레이아웃의 실제 SSR head 출력을 검증한다.
- 수정: `src/routes/+layout.svelte` — 전역 파비콘 선언만 담당한다.
- 수정: `src/app.html` — Svelte 초기화 전 스플래시 마크업, 스타일, DOM 제거만 담당한다.
- 생성: `md/planning/planning_app-launch-splash-implementation.md` — 승인된 설계를 실행 가능한 단계로 기록한다.

---

### 작업 1: 호이 핀 파비콘 교체

**파일:**

- 생성: `src/lib/config/app-shell.test.ts`
- 수정: `src/routes/+layout.svelte`

**인터페이스:**

- 입력: SvelteKit 정적 파일 경로 `/icon.png`
- 출력: 모든 라우트 문서의 `<link rel="icon" type="image/png" href="/icon.png" />`

- [x] **1단계: 실패하는 파비콘 테스트 작성**

```ts
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import RootLayout from '../../routes/+layout.svelte';

const children = createRawSnippet(() => ({ render: () => '' }));

describe('앱 문서 셸', () => {
	it('호이 핀 PNG를 전역 파비콘으로 사용한다', () => {
		const { head } = render(RootLayout, { props: { children } });

		expect(head).toContain('<link rel="icon" type="image/png" href="/icon.png"/>');
		expect(head).not.toContain('svelte-logo');
	});
});
```

- [x] **2단계: 테스트 실패 확인**

실행: `npx vitest run src/lib/config/app-shell.test.ts`

예상 결과: 현재 레이아웃이 `favicon.svg`를 가져오므로 파비콘 기대값에서 실패한다.

- [x] **3단계: 최소 파비콘 구현**

`src/routes/+layout.svelte`에서 Svelte 기본 아이콘 import를 제거하고 head를 다음과 같이 변경한다.

```svelte
<svelte:head>
	<link rel="icon" type="image/png" href="/icon.png" />
</svelte:head>
```

- [x] **4단계: 파비콘 테스트 통과 확인**

실행: `npx vitest run src/lib/config/app-shell.test.ts`

예상 결과: 1개 테스트가 통과한다.

---

### 작업 2: 최초 문서 진입 스플래시 구현

**파일:**

- 수정: `src/app.html`

**인터페이스:**

- 입력: 문서 최초 로드와 `/icon.png`
- 출력: `#app-launch-splash` 오버레이, `app-launch-icon-grow` 및 `app-launch-splash-exit` 애니메이션, 종료 시 DOM 제거
- 보장: 스플래시는 SvelteKit 렌더 루트 바깥에 있어 클라이언트 내부 탐색에서 다시 생성되지 않는다.

- [x] **1단계: 실제 브라우저에서 실패하는 인수 조건 확인**

개발 서버를 실행하고 새 문서로 진입한 직후 브라우저에서 `document.getElementById('app-launch-splash')`를 확인한다.

예상 결과: 현재 구현에는 해당 요소가 없어 `null`이고, 흰색 배경에서 호이 핀이 확대되는 시작 화면도 보이지 않는다. 이 실패는 요구 기능이 아직 없기 때문에 발생한다.

- [x] **2단계: 스플래시 마크업과 애니메이션 구현**

`src/app.html`의 `<head>`에 스플래시 전용 스타일을 추가한다. 오버레이는 `position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; background: #ffffff`를 사용한다. 원본 PNG의 투명 여백을 고려해 아이콘 폭은 `clamp(144px, 46vw, 224px)`로 제한하고 `object-fit: contain`을 사용한다.

`app-launch-icon-grow`는 시작 시 `transform: scale(0.7); opacity: 0.82`, 72%부터 `scale(1); opacity: 1`을 유지한다. `app-launch-splash-exit`는 72%까지 불투명하게 유지한 뒤 800ms 시점에 `opacity: 0; visibility: hidden; pointer-events: none`으로 끝낸다. 두 애니메이션은 800ms이며 과도한 튕김이나 회전을 사용하지 않는다.

`<body>`의 SvelteKit 렌더 루트 앞에 다음 마크업을 둔다.

```html
<div id="app-launch-splash" aria-hidden="true">
	<img src="/icon.png" alt="" />
</div>
```

SvelteKit 렌더 루트 뒤에는 오버레이 자신에게서 발생한 종료 이벤트만 처리하고 1.2초 안전 타이머를 함께 두는 정리 스크립트를 추가한다.

```html
<script>
	(() => {
		const splash = document.getElementById('app-launch-splash');
		if (!splash) return;

		const removeSplash = () => splash.remove();
		splash.addEventListener(
			'animationend',
			(event) => {
				if (event.target === splash) removeSplash();
			}
		);
		window.setTimeout(removeSplash, 1200);
	})();
</script>
```

동작 줄이기 미디어 쿼리에서는 아이콘 애니메이션을 `none`으로 하고 오버레이 종료 시간을 200ms로 단축한다.

- [x] **3단계: 실제 브라우저에서 인수 조건 통과 확인**

브라우저 새로고침 직후 화면과 DOM을 확인한다.

- `#app-launch-splash`가 SvelteKit 렌더 루트 바깥에서 생성된다.
- 배경 계산값은 흰색이고 호이 핀 이미지의 비율이 유지된다.
- 호이 핀은 약 70%에서 100%로 확대되고 전체 오버레이는 약 0.8초 뒤 사라진다.
- 1.2초가 지난 뒤 `document.getElementById('app-launch-splash')`는 `null`이다.
- 내부 링크로 이동했을 때 스플래시가 다시 생성되지 않는다.
- 브라우저의 동작 줄이기 에뮬레이션에서는 확대 이동 없이 0.2초 안에 사라진다.

예상 결과: 위 조건이 모두 충족된다.

---

### 작업 3: 정적 검증과 실제 브라우저 확인

**파일:**

- 수정 없음

**인터페이스:**

- 입력: 완성된 문서 셸
- 출력: 단위 테스트, 타입 검사, 프로덕션 빌드, 실제 브라우저 동작의 검증 증거

- [x] **1단계: 전체 자동 검증 실행**

실행: `npm test`

예상 결과: 전체 Vitest 테스트가 실패 없이 통과한다.

실행: `npm run check`

예상 결과: Svelte 및 TypeScript 오류 0개다.

실행: `npm run build`

예상 결과: Cloudflare 대상 프로덕션 빌드가 종료 코드 0으로 완료된다.

- [x] **2단계: 개발 서버에서 시각 동작 확인**

실행: `npm run dev -- --host 127.0.0.1`

브라우저에서 다음을 확인한다.

- 새 문서 진입 시 흰색 배경 중앙의 호이 핀이 약 0.8초 동안 부드럽게 확대되고 사라진다.
- 아이콘이 잘리거나 찌그러지지 않는다.
- 스플래시 이후 홈 화면의 터치와 스크롤이 정상 동작한다.
- 홈에서 다른 내부 라우트로 이동할 때 스플래시가 다시 나타나지 않는다.
- 문서 head의 파비콘 href가 `/icon.png`다.

- [x] **3단계: 구현 파일만 커밋하고 푸시**

스테이징 대상은 다음 네 파일로 제한한다.

```text
md/planning/planning_app-launch-splash-implementation.md
src/lib/config/app-shell.test.ts
src/routes/+layout.svelte
src/app.html
```

실행: `git diff --check` 및 `git diff --cached --check`

예상 결과: 공백 오류가 없다.

커밋 메시지: `feat: 호이 핀 앱 시작 화면 적용`

실행: `git push origin main`

예상 결과: 구현 커밋이 원격 `main`에 반영된다.

---

### 작업 4: Cloudflare 배포 및 운영 확인

**파일:**

- 수정 없음

**인터페이스:**

- 입력: 원격 `main`에 반영된 검증 완료 빌드
- 출력: Cloudflare 배포 URL과 운영 응답 검증 결과

- [x] **1단계: Cloudflare Worker 배포**

실행: `npm run deploy`

예상 결과: Wrangler가 배포 성공과 운영 URL 또는 배포 버전을 출력한다.

- [x] **2단계: 운영 URL 확인**

배포 결과의 운영 URL에서 `/`와 `/icon.png`가 HTTP 200인지 확인한다. 새 문서 진입 스플래시와 파비콘 링크가 배포 빌드에서도 유지되는지 브라우저로 확인한다.

- [x] **3단계: 최종 작업 트리 확인**

실행: `git status --short`

예상 결과: 이번 기능 파일에 미커밋 변경이 없으며, 작업 전부터 존재한 사용자 파일만 남는다.
