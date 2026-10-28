<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onDestroy, onMount, tick } from 'svelte';
	import { Check, Eye, X } from '@lucide/svelte';
	import {
		buildDepartmentOptions,
		collegeOptions,
		genderOptions,
		getCollegeLabel,
		nonUndergraduateCollege,
		studentYearOptions,
		validateNickname,
		type OnboardingInput
	} from '$lib/domain/onboarding';

	type NicknameCheck = {
		nickname: string;
		status: 'available' | 'duplicate' | 'invalid' | 'error';
		message: string;
	};

	let {
		mode,
		message = null,
		submittedValues = null,
		nicknameCheck = null,
		next = '/',
		exitHref = '/my'
	}: {
		mode: 'register' | 'preview';
		message?: string | null;
		submittedValues?: OnboardingInput | null;
		nicknameCheck?: NicknameCheck | null;
		next?: string;
		exitHref?: string;
	} = $props();

	const isPreview = $derived(mode === 'preview');
	const steps = ['닉네임', '단과대', '학부·학과/전공', '학번', '성별'];

	let step = $state(0);
	let nickname = $state('');
	let college = $state('');
	let department = $state('');
	let studentYear = $state('');
	let gender = $state('');
	let isSubmitting = $state(false);
	let isCheckingNickname = $state(false);
	let isNicknameComposing = $state(false);
	let viewportHeight = $state<number | null>(null);
	let nicknameInput = $state<HTMLInputElement>();
	let optionsSection = $state<HTMLElement>();

	function getInitialSubmittedValues() {
		return submittedValues;
	}

	const initialSubmittedValues = getInitialSubmittedValues();
	if (initialSubmittedValues) {
		nickname = initialSubmittedValues.nickname;
		college = initialSubmittedValues.college;
		department = initialSubmittedValues.department;
		studentYear = initialSubmittedValues.studentYear;
		gender = initialSubmittedValues.gender;
	}

	let departments = $derived(college ? buildDepartmentOptions(college) : []);
	const isNonUndergraduate = $derived(college === nonUndergraduateCollege);
	let previewNoticeVisible = $state(false);
	let previewNoticeTimer: ReturnType<typeof setTimeout> | undefined;
	let nicknameCheckInvalidated = $state(false);
	let nicknameInputError = $derived(validateNickname(nickname));
	const nicknameValidationMessage = $derived(
		!isNicknameComposing && nickname.length > 0 ? nicknameInputError : null
	);
	let hasConfirmedNickname = $derived(
		!nicknameCheckInvalidated && nicknameCheck?.status === 'available' && nicknameCheck.nickname === nickname
	);
	let nicknameCheckResult = $derived(
		!nicknameCheckInvalidated && nicknameCheck?.nickname === nickname ? nicknameCheck : null
	);

	$effect(() => {
		if (!submittedValues) return;
		nickname = submittedValues.nickname;
		college = submittedValues.college;
		department = submittedValues.department;
		studentYear = submittedValues.studentYear;
		gender = submittedValues.gender;
		nicknameCheckInvalidated = false;
	});

	$effect(() => {
		if (department && !departments.includes(department)) {
			department = '';
		}
		if (isNonUndergraduate) studentYear = '';
	});

	function canGoNext() {
		if (step === 0) return hasConfirmedNickname;
		if (step === 1) return Boolean(college);
		if (step === 2) return Boolean(department);
		if (step === 3) return Boolean(studentYear);
		return Boolean(gender);
	}

	function nextStep() {
		if (step < steps.length - 1 && canGoNext()) {
			step = step === 2 && isNonUndergraduate ? 4 : step + 1;
			if (optionsSection) optionsSection.scrollTop = 0;
		}
	}

	function prevStep() {
		if (step > 0) {
			step = step === 4 && isNonUndergraduate ? 2 : step - 1;
			if (optionsSection) optionsSection.scrollTop = 0;
		}
	}

	function showPreviewNotice() {
		previewNoticeVisible = true;
		if (previewNoticeTimer) clearTimeout(previewNoticeTimer);
		previewNoticeTimer = setTimeout(() => (previewNoticeVisible = false), 2200);
	}

	function invalidateNicknameCheck() {
		nicknameCheckInvalidated = true;
	}

	function clearNickname() {
		nickname = '';
		invalidateNicknameCheck();
		nicknameInput?.focus();
	}

	const nicknameStatusText = $derived(
		isCheckingNickname ? '닉네임을 확인하고 있어요' :
		nicknameValidationMessage ? nicknameValidationMessage :
		nicknameCheckResult?.status === 'available' ? '사용 가능한 닉네임이에요' :
		nicknameCheckResult?.status === 'duplicate' ? '이미 사용 중인 닉네임이에요' :
		nicknameCheckResult?.message ?? '닉네임 중복 확인이 필요해요'
	);

	const enhanceOnboarding: SubmitFunction = ({ action, cancel }) => {
		if (isSubmitting) { cancel(); return; }
		isSubmitting = true;
		isCheckingNickname = action.search.includes('/checkNickname');
		return async ({ result, update }) => {
			try { await update({ reset: false, invalidateAll: result.type === 'redirect' }); }
			finally { isSubmitting = false; isCheckingNickname = false; }
		};
	};

	onMount(() => {
		const viewport = window.visualViewport;
		if (!viewport) return;
		const updateHeight = () => {
			if (viewport.scale !== 1) return;
			viewportHeight = Math.round(viewport.height);
			if (document.activeElement === nicknameInput) {
				void tick().then(() => nicknameInput?.scrollIntoView?.({ block: 'nearest' }));
			}
		};
		updateHeight();
		viewport.addEventListener('resize', updateHeight);
		return () => viewport.removeEventListener('resize', updateHeight);
	});

	onDestroy(() => {
		if (previewNoticeTimer) clearTimeout(previewNoticeTimer);
	});
</script>

<main class="onboarding-screen" style:--onboarding-viewport-height={viewportHeight ? viewportHeight + 'px' : undefined}>
	<form method="POST" action="?/checkNickname" class="onboarding-form app-page-frame" class:compact-viewport={viewportHeight !== null && viewportHeight < 480} use:enhance={enhanceOnboarding} aria-busy={isSubmitting}>
		<input type="hidden" name="nickname" value={nickname} />
		<input type="hidden" name="college" value={college} />
		<input type="hidden" name="department" value={department} />
		<input type="hidden" name="studentYear" value={studentYear} />
		<input type="hidden" name="gender" value={gender} />
		{#if !isPreview}<input type="hidden" name="next" value={next} />{/if}

		{#if isPreview}
			<div class="preview-tools">
				<span><Eye size={14} strokeWidth={2.4} /> 미리보기</span>
				<a href={exitHref}><X size={14} strokeWidth={2.4} /> 미리보기 나가기</a>
			</div>
		{/if}

		<div class="onboarding-intro" data-onboarding-intro>
			<header class="onboarding-copy">
				<p class="account-status">카카오 계정 연동 완료</p>
				<div class="intro-copy">
					<h1>당신의 정보를 알려주세요</h1>
					<p class="intro-description">입력한 정보는 골라바유의 맞춤 정보 제공과 통계에만 사용해요.</p>
				</div>
			</header>
			<div class="onboarding-progress" role="progressbar" aria-label={'온보딩 진행도 ' + (step + 1) + ' / ' + steps.length} aria-valuemin="1" aria-valuemax={steps.length} aria-valuenow={step + 1}>
				{#each steps as item, index}
					<span class:current={index <= step} aria-label={item}></span>
				{/each}
			</div>
		</div>

		{#if message}<p class="onboarding-error" role="alert">{message}</p>{/if}

		<section class="onboarding-fields" bind:this={optionsSection} aria-labelledby="onboarding-field-label" data-onboarding-fields>
			{#if step === 0}
				<div class="field-section">
					<label class="field-label" id="onboarding-field-label" for="nickname">닉네임을 입력하세요</label>
					<div class="nickname-field-group">
						<div class="nickname-row">
							<div class="nickname-input-shell">
								<input bind:value={nickname} bind:this={nicknameInput} id="nickname" maxlength="10" autocomplete="nickname" oninput={invalidateNicknameCheck} oncompositionstart={() => (isNicknameComposing = true)} oncompositionend={() => (isNicknameComposing = false)} placeholder="닉네임을 입력하세요" readonly={isSubmitting} aria-describedby="nickname-help" aria-invalid={Boolean(nicknameValidationMessage) || nicknameCheckResult?.status === 'duplicate' || nicknameCheckResult?.status === 'invalid'} />
								{#if nickname}
									<button class="nickname-clear" type="button" aria-label="닉네임 지우기" onclick={clearNickname} disabled={isSubmitting}><span class="nickname-clear-icon" aria-hidden="true"></span></button>
								{/if}
							</div>
							<button class="nickname-check" class:confirmed={hasConfirmedNickname} aria-busy={isCheckingNickname} disabled={Boolean(nicknameInputError) || isNicknameComposing || hasConfirmedNickname || isSubmitting} formaction="?/checkNickname" type="submit">중복 확인</button>
						</div>
						<div class="nickname-help" id="nickname-help">
							<ul>
								<li class:available={nicknameCheckResult?.status === 'available'} class:invalid={Boolean(nicknameValidationMessage) || (nicknameCheckResult && nicknameCheckResult.status !== 'available')} aria-live="polite" role="status">{nicknameStatusText}</li>
								<li>2~10자의 한글, 영문, 숫자를 사용할 수 있어요</li>
							</ul>
						</div>
					</div>
				</div>
			{:else if step === 1}
				<div class="field-section">
					<h2 class="field-label" id="onboarding-field-label">단과대를 선택하세요</h2>
					<div class="selection-options" role="group" aria-labelledby="onboarding-field-label">
						{#each collegeOptions as option}
							<button class="selection-option" class:selected={college === option} type="button" aria-pressed={college === option} onclick={() => (college = option)}>{getCollegeLabel(option)}</button>
						{/each}
					</div>
				</div>
			{:else if step === 2}
				<div class="field-section">
					<h2 class="field-label" id="onboarding-field-label">{isNonUndergraduate ? '현재 신분을 선택하세요' : '학부·학과/전공을 선택하세요'}</h2>
					{#if !college}
						<p class="field-empty">먼저 단과대를 선택해 주세요.</p>
					{:else}
						<div class="selection-options" role="group" aria-labelledby="onboarding-field-label">
							{#each departments as option}
								<button class="selection-option" class:selected={department === option} type="button" aria-pressed={department === option} onclick={() => (department = option)}>{option}</button>
							{/each}
						</div>
					{/if}
				</div>
			{:else if step === 3}
				<div class="field-section">
					<h2 class="field-label" id="onboarding-field-label">학번을 선택해주세요</h2>
					<div class="selection-options year-options" role="group" aria-labelledby="onboarding-field-label">
						{#each studentYearOptions as option}
							<button class="selection-option" class:selected={studentYear === option} type="button" aria-pressed={studentYear === option} onclick={() => (studentYear = option)}>{option}</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="field-section">
					<h2 class="field-label" id="onboarding-field-label">성별을 선택해주세요</h2>
					<div class="selection-options" role="group" aria-labelledby="onboarding-field-label">
						{#each genderOptions as option}
							<button class="selection-option" class:selected={gender === option.value} type="button" aria-pressed={gender === option.value} onclick={() => (gender = option.value)}>{option.label}</button>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<footer class="onboarding-actions">
			<button class="previous-button" type="button" disabled={step === 0 || isSubmitting} onclick={prevStep}>이전</button>
			{#if step < steps.length - 1}
				<button class="next-button" type="button" disabled={!canGoNext() || isSubmitting} onclick={nextStep}>다음</button>
			{:else}
				<button class="next-button" type={isPreview ? 'button' : 'submit'} disabled={!canGoNext() || isSubmitting} formaction={isPreview ? undefined : '?/complete'} onclick={isPreview ? showPreviewNotice : undefined}>다음</button>
			{/if}
		</footer>
	</form>

	{#if isPreview}
		<div class="preview-notice" class:visible={previewNoticeVisible} role="status" aria-live="polite" aria-hidden={!previewNoticeVisible}>
			<Check size={16} strokeWidth={2.6} /> 미리보기에서는 정보가 저장되지 않습니다.
		</div>
	{/if}
</main>

<style>
	.onboarding-screen {
		--onboarding-primary: #8a1538;
		--onboarding-text: #19181a;
		--onboarding-muted: #9b989e;
		--onboarding-border: #c9c6ca;
		--onboarding-border-subtle: #e7e5e7;
		--onboarding-page: #f8f8f6;
		font-synthesis: none;
		font-size: 14px;
		font-weight: 400;
		letter-spacing: 0;
		color: var(--onboarding-text);
		background: white;
		min-height: 100vh;
		min-height: 100dvh;
	}
	.onboarding-form {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 430px;
		height: 100vh;
		height: var(--onboarding-viewport-height, 100dvh);
		margin-inline: auto;
		padding: calc(60px + env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom));
		background: white;
	}
	.onboarding-intro { display: flex; flex-direction: column; gap: 32px; flex-shrink: 0; }
	.onboarding-copy { display: flex; flex-direction: column; gap: 8px; }
	.account-status { margin: 0; padding-block: 2px; color: var(--onboarding-primary); font-size: 12px; line-height: 1.2; }
	.intro-copy { display: flex; flex-direction: column; gap: 4px; }
	h1 { margin: 0; padding-block: 2px; font-size: 18px; font-weight: 700; line-height: 1.2; letter-spacing: 0; }
	.intro-description { margin: 0; padding-block: 2px; color: var(--onboarding-muted); font-size: 12px; line-height: 1.2; }
	.onboarding-progress { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; }
	.onboarding-progress span { height: 3px; border-radius: 2px; background: var(--onboarding-border); transition: background-color 200ms; }
	.onboarding-progress .current { background: var(--onboarding-primary); }
	.onboarding-fields { flex: 1; min-height: 0; margin-top: 48px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
	.field-section { display: flex; flex-direction: column; gap: 16px; padding-bottom: 20px; }
	.field-label { display: block; flex-shrink: 0; margin: 0; padding-block: 2px; font-size: 16px; font-weight: 600; line-height: 1.2; }
	.nickname-field-group { display: flex; flex-direction: column; gap: 8px; }
	.nickname-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
	.nickname-input-shell { position: relative; min-width: 0; }
	.nickname-input-shell input { width: 100%; height: 48px; border: 1px solid var(--onboarding-border); border-radius: 12px; padding: 13px 48px 13px 24px; background: white; color: var(--onboarding-text); font: 500 14px/1.4 'Pretendard', sans-serif; letter-spacing: 0; outline: none; }
	.nickname-input-shell input::placeholder { color: #f0efec; opacity: 1; }
	.nickname-input-shell input:focus-visible { border-color: var(--onboarding-primary); }
	.nickname-clear { position: absolute; right: 4px; top: 2px; display: grid; place-items: center; width: 44px; height: 44px; padding: 0; border: 0; background: transparent; color: var(--onboarding-border); }
	.nickname-clear-icon { display: block; width: 20px; height: 20px; background: currentColor; mask: url('/onboarding/clear.svg') center / contain no-repeat; }
	.nickname-check { height: 48px; padding-inline: 20px; border: 1px solid var(--onboarding-primary); border-radius: 12px; background: white; color: var(--onboarding-primary); font: 400 14px/1.4 'Pretendard', sans-serif; letter-spacing: 0; white-space: nowrap; }
	.nickname-check:active, .nickname-check[aria-busy='true'] { background: #f7eff2; }
	.nickname-check.confirmed { border-color: var(--onboarding-border-subtle); background: var(--onboarding-page); color: var(--onboarding-muted); }
	.nickname-help { padding-block: 2px; color: var(--onboarding-muted); font-size: 12px; line-height: 1.2; }
	.nickname-help ul { margin: 0; padding: 0 0 0 18px; list-style: disc; }
	.nickname-help li { padding-block: 2px; }
	.nickname-help .available { color: #24966b; }
	.nickname-help .invalid { color: var(--onboarding-primary); }
	.selection-options { display: grid; gap: 8px; }
	.selection-option { display: flex; align-items: center; min-height: 45px; border: 1px solid var(--onboarding-border); border-radius: 12px; padding: 13px 23px; background: white; color: var(--onboarding-text); font: 500 14px/1.2 'Pretendard', sans-serif; letter-spacing: 0; text-align: left; overflow-wrap: anywhere; transition: background-color 200ms, color 200ms, border-color 200ms; }
	.selection-option.selected { border-color: var(--onboarding-primary); background: var(--onboarding-primary); color: white; }
	.year-options { grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 8px; row-gap: 16px; }
	.year-options .selection-option { justify-content: center; text-align: center; }
	.field-empty { margin: 0; color: var(--onboarding-muted); font-size: 12px; line-height: 1.4; }
	.onboarding-actions { display: grid; grid-template-columns: 80px minmax(0, 1fr); gap: 8px; flex-shrink: 0; padding-top: 20px; background: white; }
	.previous-button, .next-button { min-width: 0; height: 45px; padding-inline: 24px; border: 1px solid var(--onboarding-border); border-radius: 12px; font: 500 14px/1.2 'Pretendard', sans-serif; letter-spacing: 0; text-align: center; }
	.previous-button { color: var(--onboarding-muted); background: white; }
	.next-button { border-color: var(--onboarding-primary); color: white; background: var(--onboarding-primary); }
	.next-button:disabled { border-color: var(--onboarding-border-subtle); color: var(--onboarding-muted); background: var(--onboarding-page); }
	button:focus-visible, .preview-tools a:focus-visible { outline: 2px solid var(--onboarding-primary); outline-offset: 2px; }
	.onboarding-error { margin: 16px 0 0; color: var(--onboarding-primary); font-size: 12px; line-height: 1.4; }
	.preview-tools { position: absolute; top: max(12px, env(safe-area-inset-top)); inset-inline: 20px; display: flex; justify-content: space-between; align-items: center; color: var(--onboarding-muted); font-size: 12px; }
	.preview-tools span, .preview-tools a { display: flex; align-items: center; gap: 6px; }
	.preview-tools a { min-height: 36px; color: inherit; text-decoration: none; }
	.preview-notice { pointer-events: none; position: fixed; bottom: calc(84px + env(safe-area-inset-bottom)); inset-inline: 20px; z-index: 50; display: flex; align-items: center; gap: 8px; max-width: 390px; margin-inline: auto; padding: 10px 12px; border: 1px solid var(--onboarding-primary); border-radius: 10px; background: white; color: var(--onboarding-primary); font-size: 12px; line-height: 1.4; opacity: 0; }
	.preview-notice.visible { opacity: 1; }
	/* 키보드나 가로 화면으로 높이가 줄면 입력란과 하단 동작을 함께 보여준다. */
	.onboarding-form.compact-viewport { padding-top: max(20px, env(safe-area-inset-top)); }
	.compact-viewport .onboarding-intro { gap: 16px; }
	.compact-viewport .onboarding-fields { margin-top: 24px; }
	@media (min-width: 768px) {
		.onboarding-screen { display: grid; place-items: center; padding: 24px; background: var(--onboarding-page); }
		.onboarding-form { height: min(844px, calc(var(--onboarding-viewport-height, 100dvh) - 48px)); }
	}
	@media (prefers-reduced-motion: reduce) {
		.onboarding-progress span, .selection-option { transition: none; }
	}
</style>
