# 관리자 온보딩 미리보기 구현 계획

> **에이전트 작업자 필수 하위 스킬:** 이 계획은 `superpowers:executing-plans`를 사용해 작업별로 실행한다. 모든 단계는 체크박스로 추적한다.

**목표:** 관리자 마이페이지에서 실제 사용자 온보딩 UI를 DB 저장 없이 반복 확인하고 안전하게 나갈 수 있는 관리자 전용 미리보기를 제공한다.

**구조:** 기존 `/register`의 단계 상태와 화면을 `OnboardingFlow.svelte`로 분리해 실제 가입과 관리자 미리보기가 같은 UI를 사용한다. `/admin/onboarding-preview`는 서버에서 관리자 권한만 허용하며, 미리보기 모드는 제출을 클라이언트에서 끝내고 안내 토스트만 표시한다.

**기술 스택:** SvelteKit 2, Svelte 5, TypeScript 6, Tailwind CSS 4, Vitest 4, Svelte SSR 테스트

## 전역 제약 조건

- 모든 사용자 문구, 테스트 설명, 문서는 한국어로 작성한다.
- 미리보기 입력값은 브라우저 메모리에만 두고 POST, Neon DB, KV, 외부 API 호출을 만들지 않는다.
- 일반 사용자의 `/register` 제출, 서버 검증, 실패 값 복원 동작은 유지한다.
- 관리자 미리보기는 빈 값과 첫 단계에서 시작한다.
- 미리보기의 마지막 버튼 문구와 디자인은 실제 화면과 같은 `시작하기`를 유지한다.
- 토스트는 흰색 배경, 크림슨 아이콘·테두리, `role="status"`, `aria-live="polite"`를 사용한다.
- 320~430px 모바일 폭, 안전 영역, 브라우저·Capacitor 뒤로 가기를 고려한다.
- 기존 사용자 변경 파일과 미추적 파일은 수정하거나 스테이징하지 않는다.
- 사용자가 구현 커밋을 별도로 승인하지 않았으므로 코드 커밋과 푸시는 이 계획 범위에 포함하지 않는다.

## 파일 구성

- 생성: `src/lib/onboarding/OnboardingFlow.svelte` — 실제 가입과 미리보기의 공통 단계 UI와 클라이언트 상태를 담당한다.
- 생성: `src/lib/onboarding/onboarding-flow.test.ts` — 두 모드의 SSR 출력과 저장 차단 계약을 검증한다.
- 수정: `src/routes/register/+page.svelte` — 서버 데이터와 액션 결과를 공통 컴포넌트에 전달하는 얇은 래퍼가 된다.
- 생성: `src/routes/admin/onboarding-preview/+page.server.ts` — 관리자 권한만 허용하고 DB 데이터는 반환하지 않는다.
- 생성: `src/routes/admin/onboarding-preview/onboarding-preview-server.test.ts` — 비로그인·일반 사용자·관리자 접근을 검증한다.
- 생성: `src/routes/admin/onboarding-preview/+page.svelte` — 공통 컴포넌트를 미리보기 모드로 렌더링한다.
- 수정: `src/routes/my/+page.svelte` — 관리자 전용 `온보딩 미리보기` 링크를 추가한다.
- 생성: `src/routes/my/my-page-admin-tools.test.ts` — 관리자와 일반 사용자의 미리보기 링크 노출 차이를 검증한다.
- 생성: `md/planning/planning_onboarding-preview-implementation.md` — 구현과 검증 단계를 기록한다.

---

### 작업 1: 관리자 미리보기 접근 계약

**파일:**

- 생성: `src/routes/admin/onboarding-preview/onboarding-preview-server.test.ts`
- 생성: `src/routes/admin/onboarding-preview/+page.server.ts`

**인터페이스:**

- 입력: `locals.user`
- 출력: 관리자는 `{ preview: true }`, 비로그인은 로그인 경로로 303, 일반 사용자는 홈으로 303

- [x] **1단계: 실패하는 서버 접근 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { load } from './+page.server';

const admin = { id: 1, role: 'admin', isOnboarded: true };
const user = { id: 2, role: 'user', isOnboarded: true };

describe('관리자 온보딩 미리보기 접근', () => {
	it('비로그인 사용자를 로그인으로 보낸다', async () => {
		await expect(load({ locals: { user: null } } as never)).rejects.toMatchObject({
			status: 303,
			location: '/login?next=/admin/onboarding-preview'
		});
	});

	it('일반 사용자를 홈으로 보낸다', async () => {
		await expect(load({ locals: { user } } as never)).rejects.toMatchObject({
			status: 303,
			location: '/'
		});
	});

	it('관리자에게 DB 데이터 없이 미리보기 상태만 제공한다', async () => {
		await expect(load({ locals: { user: admin } } as never)).resolves.toEqual({ preview: true });
	});
});
```

- [x] **2단계: 테스트 실패 확인**

실행: `npx vitest run src/routes/admin/onboarding-preview/onboarding-preview-server.test.ts`

예상 결과: `+page.server` 모듈이 없어 실패한다.

- [x] **3단계: 최소 서버 로드 구현**

```ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login?next=/admin/onboarding-preview');
	if (locals.user.role !== 'admin') throw redirect(303, '/');

	return { preview: true };
};
```

- [x] **4단계: 서버 접근 테스트 통과 확인**

실행: `npx vitest run src/routes/admin/onboarding-preview/onboarding-preview-server.test.ts`

예상 결과: 3개 테스트가 통과한다.

---

### 작업 2: 실제 가입과 미리보기의 공통 온보딩 화면

**파일:**

- 생성: `src/lib/onboarding/OnboardingFlow.svelte`
- 생성: `src/lib/onboarding/onboarding-flow.test.ts`
- 수정: `src/routes/register/+page.svelte`
- 생성: `src/routes/admin/onboarding-preview/+page.svelte`

**인터페이스:**

- 입력 속성: `mode: 'register' | 'preview'`, `message?: string | null`, `submittedValues?: OnboardingInput | null`, `exitHref?: string`
- 출력: 동일한 5단계 온보딩 UI. `register`는 POST, `preview`는 요청 없이 토스트 표시

- [x] **1단계: 실패하는 공통 화면 SSR 테스트 작성**

```ts
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import OnboardingFlow from './OnboardingFlow.svelte';

describe('공통 온보딩 화면', () => {
	it('실제 가입 모드는 POST 폼을 제공하고 미리보기 도구를 숨긴다', () => {
		const { body } = render(OnboardingFlow, { props: { mode: 'register' } });

		expect(body).toContain('method="POST"');
		expect(body).not.toContain('미리보기 나가기');
	});

	it('미리보기 모드는 나가기와 저장 차단 안내를 제공하고 POST 폼을 만들지 않는다', () => {
		const { body } = render(OnboardingFlow, {
			props: { mode: 'preview', exitHref: '/my' }
		});

		expect(body).toContain('미리보기 나가기');
		expect(body).toContain('href="/my"');
		expect(body).not.toContain('method="POST"');
		expect(body).toContain('미리보기에서는 정보가 저장되지 않습니다.');
		expect(body).toContain('aria-live="polite"');
	});
});
```

- [x] **2단계: 공통 화면 테스트 실패 확인**

실행: `npx vitest run src/lib/onboarding/onboarding-flow.test.ts`

예상 결과: `OnboardingFlow.svelte`가 없어 실패한다.

- [x] **3단계: 공통 컴포넌트 상태와 제출 경계 구현**

`OnboardingFlow.svelte`는 기존 `/register`의 `step`, `nickname`, `college`, `department`, `studentYear`, `gender`, `canGoNext`, `nextStep`, `prevStep`과 단계별 마크업을 그대로 이동한다. 속성과 미리보기 제출 처리는 다음 계약을 사용한다.

```svelte
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Check, ChevronLeft, ChevronRight, Eye, X } from '@lucide/svelte';
	import type { OnboardingInput } from '$lib/domain/onboarding';

	let {
		mode,
		message = null,
		submittedValues = null,
		exitHref = '/my'
	}: {
		mode: 'register' | 'preview';
		message?: string | null;
		submittedValues?: OnboardingInput | null;
		exitHref?: string;
	} = $props();

	const isPreview = $derived(mode === 'preview');
	let previewNoticeVisible = $state(false);
	let previewNoticeTimer: ReturnType<typeof setTimeout> | undefined;

	function submitPreview(event: SubmitEvent) {
		if (!isPreview) return;
		event.preventDefault();
		previewNoticeVisible = true;
		if (previewNoticeTimer) clearTimeout(previewNoticeTimer);
		previewNoticeTimer = setTimeout(() => (previewNoticeVisible = false), 2200);
	}

	onDestroy(() => {
		if (previewNoticeTimer) clearTimeout(previewNoticeTimer);
	});
</script>
```

폼은 `method={isPreview ? undefined : 'POST'}`와 `onsubmit={submitPreview}`를 사용한다. 미리보기 상단에는 `Eye` 아이콘과 `미리보기`, `/my` 링크의 `미리보기 나가기`를 표시한다. 마지막 `시작하기`는 두 모드 모두 같은 클래스와 문구를 사용한다. 토스트는 DOM에 항상 렌더링하되 `previewNoticeVisible`에 따라 이동·투명도 클래스와 `aria-hidden`을 전환해 SSR 테스트와 접근성 계약을 유지한다.

- [x] **4단계: 실제 가입 래퍼를 공통 컴포넌트로 교체**

`src/routes/register/+page.svelte`는 액션 결과만 변환한다.

```svelte
<script lang="ts">
	import OnboardingFlow from '$lib/onboarding/OnboardingFlow.svelte';
	import type { OnboardingInput } from '$lib/domain/onboarding';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const submittedValues = $derived(
		(form && 'values' in form ? form.values : null) as OnboardingInput | null
	);
</script>

<svelte:head><title>온보딩 | 골라바유</title></svelte:head>

<OnboardingFlow mode="register" message={form?.message ?? null} {submittedValues} />
```

- [x] **5단계: 관리자 미리보기 페이지 구현**

```svelte
<script lang="ts">
	import OnboardingFlow from '$lib/onboarding/OnboardingFlow.svelte';
</script>

<svelte:head><title>온보딩 미리보기 | 골라바유</title></svelte:head>

<OnboardingFlow mode="preview" exitHref="/my" />
```

- [x] **6단계: 공통 화면과 기존 온보딩 테스트 통과 확인**

실행: `npx vitest run src/lib/onboarding/onboarding-flow.test.ts src/lib/domain/onboarding.test.ts`

예상 결과: 공통 화면 2개와 기존 온보딩 도메인 3개 테스트가 통과한다.

---

### 작업 3: 관리자 마이페이지 진입 링크

**파일:**

- 수정: `src/routes/my/+page.svelte`
- 생성: `src/routes/my/my-page-admin-tools.test.ts`

**인터페이스:**

- 입력: `data.user.role`
- 출력: 관리자에게만 `/admin/onboarding-preview` 링크 표시

- [x] **1단계: 관리자 도구 화면 테스트 작성 및 실패 확인**

마이페이지를 SSR로 렌더링해 관리자는 `/admin/onboarding-preview` 링크를 보고 일반 사용자는 보지 못하는 계약을 고정한다.

- [x] **2단계: 마이페이지 링크 구현**

`src/routes/my/+page.svelte`의 관리자 조건 안에서 `핀 수정하기` 다음에 아래 링크를 추가하고 `Eye` 아이콘을 import한다.

```svelte
<a
	class="flex h-14 items-center justify-center gap-2 rounded-[16px] border border-brand-border-strong bg-white text-base font-black text-brand"
	href="/admin/onboarding-preview"
>
	<Eye size={18} strokeWidth={2.8} />
	온보딩 미리보기
</a>
```

- [x] **3단계: 관리자 도구 테스트 통과 확인**

실행: `npx vitest run src/routes/my/my-page-admin-tools.test.ts`

예상 결과: 관리자 권한 계약 테스트가 통과한다.

---

### 작업 4: 전체 검증과 모바일 확인

**파일:**

- 수정 없음

**인터페이스:**

- 입력: 완성된 관리자 미리보기 흐름
- 출력: 자동 검증과 브라우저 인수 조건 증거

- [x] **1단계: 전체 자동 검증 실행**

실행: `npm test`

예상 결과: 전체 Vitest 테스트가 실패 없이 통과한다.

실행: `npm run check`

예상 결과: Svelte·TypeScript 오류와 경고가 0개다.

실행: `npm run build`

예상 결과: Cloudflare 어댑터 빌드가 종료 코드 0으로 완료된다.

- [ ] **2단계: 관리자 브라우저 인수 조건 확인**

관리자 세션이 있는 브라우저에서 다음을 확인한다. 관리자 세션이 제공되지 않으면 서버 접근 테스트와 SSR 결과까지만 검증하고, 실기기 검증 미완료 사유를 보고한다.

현재 확인 결과: 비로그인 직접 접근이 `/login?next=/admin/onboarding-preview`로 이동하는 것은 브라우저에서 확인했다. 관리자 인증 정보는 입력하지 않아 로그인 후 단계 조작과 모바일 실화면은 미확인 상태다.

- 마이페이지에 `온보딩 미리보기`가 표시된다.
- 첫 단계는 빈 닉네임이며 이전 버튼이 비활성화된다.
- 단과대·학과·학번·성별을 순서대로 선택할 수 있다.
- 마지막 `시작하기`를 눌러도 네트워크 POST가 없고 안내 토스트가 한 번만 표시된다.
- `미리보기 나가기`와 뒤로 가기로 `/my`에 복귀한다.
- 일반 사용자에게는 링크가 보이지 않고 직접 URL 접근도 차단된다.
- 390×844 화면에서 상단 나가기, 카드, 하단 버튼, 토스트가 안전 영역과 겹치지 않는다.

- [x] **3단계: 변경 범위와 작업 트리 확인**

실행: `git diff --check`와 `git status --short`

예상 결과: 공백 오류가 없고 이번 기능 파일 외에는 작업 전부터 존재한 사용자 변경만 남는다.
