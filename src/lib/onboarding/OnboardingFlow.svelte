<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Check, Eye, X } from '@lucide/svelte';
	import {
		buildDepartmentOptions,
		collegeOptions,
		genderOptions,
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
	const steps = ['닉네임', '단과대', '학과', '학번', '성별'];

	let step = $state(0);
	let nickname = $state('');
	let college = $state('');
	let department = $state('');
	let studentYear = $state('');
	let gender = $state('');

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
	let previewNoticeVisible = $state(false);
	let previewNoticeTimer: ReturnType<typeof setTimeout> | undefined;
	let nicknameCheckInvalidated = $state(false);
	let nicknameInputError = $derived(validateNickname(nickname));
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
		if (college === '그 외') {
			department = '그 외';
		} else if (department && !departments.includes(department)) {
			department = '';
		}
	});

	function canGoNext() {
		if (step === 0) return hasConfirmedNickname;
		if (step === 1) return Boolean(college);
		if (step === 2) return Boolean(department);
		if (step === 3) return Boolean(studentYear);
		return Boolean(gender);
	}

	function nextStep() {
		if (step < steps.length - 1 && canGoNext()) step += 1;
	}

	function prevStep() {
		if (step > 0) step -= 1;
	}

	function showPreviewNotice() {
		previewNoticeVisible = true;
		if (previewNoticeTimer) clearTimeout(previewNoticeTimer);
		previewNoticeTimer = setTimeout(() => (previewNoticeVisible = false), 2200);
	}

	function invalidateNicknameCheck() {
		nicknameCheckInvalidated = true;
	}

	onDestroy(() => {
		if (previewNoticeTimer) clearTimeout(previewNoticeTimer);
	});
</script>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<form
		method="POST"
		action="?/checkNickname"
		class="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-[calc(68px+env(safe-area-inset-top))] shadow-[0_24px_60px_rgba(72,12,31,0.10)] md:min-h-[min(844px,calc(100dvh-48px))] md:rounded-[24px] md:border md:border-brand-border"
	>
		<input type="hidden" name="nickname" value={nickname} />
		<input type="hidden" name="college" value={college} />
		<input type="hidden" name="department" value={department} />
		<input type="hidden" name="studentYear" value={studentYear} />
		<input type="hidden" name="gender" value={gender} />
		{#if !isPreview}
			<input type="hidden" name="next" value={next} />
		{/if}

		{#if isPreview}
			<div class="absolute inset-x-5 top-[max(12px,env(safe-area-inset-top))] flex items-center justify-between">
				<span class="flex items-center gap-1.5 text-[12px] font-bold text-brand-muted">
					<Eye size={14} strokeWidth={2.4} />
					미리보기
				</span>
				<a
					class="flex min-h-9 items-center gap-1 rounded-[8px] px-2.5 text-[12px] font-bold text-brand-muted transition hover:bg-brand-map"
					href={exitHref}
				>
					<X size={14} strokeWidth={2.4} />
					미리보기 나가기
				</a>
			</div>
		{/if}

		<header>
			<p class="m-0 text-[12px] font-bold text-brand">카카오 계정 연동 완료</p>
			<h1 class="m-0 mt-2 text-[22px] font-bold tracking-[-0.02em]">당신의 정보를 알려주세요</h1>
			<p class="m-0 mt-2 text-[12px] leading-5 text-brand-muted">
				입력한 정보는 골라바유 맞춤 정보 제공과 통계에만 사용해요.
			</p>
		</header>

		<div
			class="mt-4 grid grid-cols-5 gap-1"
			role="progressbar"
			aria-label={`온보딩 진행도 ${step + 1} / ${steps.length}`}
			aria-valuemin="1"
			aria-valuemax={steps.length}
			aria-valuenow={step + 1}
		>
			{#each steps as item, index}
				<span
					class={`h-[3px] rounded-full transition-colors duration-200 ${index <= step ? 'bg-brand' : 'bg-brand-border-strong'}`}
					aria-label={item}
				></span>
			{/each}
		</div>

		{#if message}
			<p class="m-0 mt-4 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] font-bold text-red-700">
				{message}
			</p>
		{/if}

		<section class="mt-6 min-h-0 flex-1 overflow-y-auto pb-4">
			{#if step === 0}
				<div class="grid gap-2.5">
					<label class="text-[13px] font-bold" for="nickname">닉네임을 입력하세요</label>
					<div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
						<input
							bind:value={nickname}
							class="h-11 min-w-0 rounded-[8px] border border-brand-border-strong px-3 text-[13px] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
							id="nickname"
							maxlength="10"
							oninput={invalidateNicknameCheck}
							placeholder="닉네임을 입력하세요"
						/>
						<button
							class="h-11 shrink-0 rounded-[8px] bg-brand px-3.5 text-[12px] font-bold text-white transition disabled:bg-brand-border-strong"
							disabled={Boolean(nicknameInputError)}
							formaction="?/checkNickname"
							type="submit"
						>
							중복 확인
						</button>
					</div>
				</div>
				<p class="m-0 mt-2.5 text-[11px] leading-[18px] text-brand-muted">
					2~10자, 한글/영문/숫자/밑줄(_)만 사용 가능, 공백 및 특수문자 불가합니다.
				</p>
				{#if nicknameCheckResult}
					<p
						class={`m-0 mt-3 rounded-[8px] px-3 py-2.5 text-[12px] font-bold ${nicknameCheckResult.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
						role="status"
						aria-live="polite"
					>
						{nicknameCheckResult.message}
					</p>
				{/if}
			{:else if step === 1}
				<div class="grid gap-2.5">
					<h2 class="m-0 text-[13px] font-bold">단과대를 선택하세요</h2>
					<div class="grid gap-2">
						{#each collegeOptions as option}
							<button
								class={`min-h-11 rounded-[8px] border px-3 text-left text-[12px] transition ${college === option ? 'border-brand bg-brand font-bold text-white' : 'border-brand-border-strong bg-white text-brand-text'}`}
								type="button"
								onclick={() => (college = option)}
							>
								{option}
							</button>
						{/each}
					</div>
				</div>
			{:else if step === 2}
				<div class="grid gap-2.5">
					<h2 class="m-0 text-[13px] font-bold">학과를 선택하세요</h2>
					{#if !college}
						<p class="m-0 rounded-[8px] bg-brand-map px-3 py-3 text-[12px] text-brand-muted">
							먼저 단과대를 선택해 주세요.
						</p>
					{:else}
						<div class="grid gap-2">
							{#each departments as option}
								<button
									class={`min-h-11 rounded-[8px] border px-3 text-left text-[12px] transition ${department === option ? 'border-brand bg-brand font-bold text-white' : 'border-brand-border-strong bg-white text-brand-text'}`}
									type="button"
									onclick={() => (department = option)}
								>
									{option}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{:else if step === 3}
				<div class="grid gap-2.5">
					<h2 class="m-0 text-[13px] font-bold">학번을 선택해주세요</h2>
					<div class="grid grid-cols-2 gap-2">
						{#each studentYearOptions as option}
							<button
								class={`h-11 rounded-[8px] border text-[12px] transition ${studentYear === option ? 'border-brand bg-brand font-bold text-white' : 'border-brand-border-strong bg-white text-brand-text'}`}
								type="button"
								onclick={() => (studentYear = option)}
							>
								{option}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="grid gap-2.5">
					<h2 class="m-0 text-[13px] font-bold">성별을 선택해주세요</h2>
					<div class="grid gap-2">
						{#each genderOptions as option}
							<button
								class={`h-11 rounded-[8px] border px-3 text-left text-[12px] transition ${gender === option.value ? 'border-brand bg-brand font-bold text-white' : 'border-brand-border-strong bg-white text-brand-text'}`}
								type="button"
								onclick={() => (gender = option.value)}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<footer class="mt-auto grid grid-cols-[72px_minmax(0,1fr)] gap-2 border-t border-transparent bg-white pt-3">
			<button
				class="h-12 rounded-[10px] border border-brand-border-strong bg-white text-[13px] font-bold text-brand-muted transition disabled:opacity-45"
				type="button"
				disabled={step === 0}
				onclick={prevStep}
			>
				이전
			</button>

			{#if step < steps.length - 1}
				<button
					class="h-12 rounded-[10px] bg-brand text-[13px] font-bold text-white transition disabled:bg-brand-border-strong"
					type="button"
					disabled={!canGoNext()}
					onclick={nextStep}
				>
					다음
				</button>
			{:else}
				<button
					class="h-12 rounded-[10px] bg-brand text-[13px] font-bold text-white transition disabled:bg-brand-border-strong"
					type={isPreview ? 'button' : 'submit'}
					disabled={!canGoNext()}
					formaction={isPreview ? undefined : '?/complete'}
					onclick={isPreview ? showPreviewNotice : undefined}
				>
					다음
				</button>
			{/if}
		</footer>
	</form>

	{#if isPreview}
		<div
			class={`pointer-events-none fixed inset-x-5 bottom-[calc(84px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[390px] items-center gap-2 rounded-[10px] border border-brand bg-white px-3 py-2.5 text-[12px] font-bold text-brand shadow-[0_12px_30px_rgba(116,17,47,0.16)] transition duration-200 ${previewNoticeVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
			role="status"
			aria-live="polite"
			aria-hidden={!previewNoticeVisible}
		>
			<Check size={16} strokeWidth={2.6} />
			미리보기에서는 정보가 저장되지 않습니다.
		</div>
	{/if}
</main>
