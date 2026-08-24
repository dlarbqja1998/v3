<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Check, ChevronLeft, ChevronRight, Eye, X } from '@lucide/svelte';
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
	});

	$effect(() => {
		if (college === '그 외') {
			department = '그 외';
		} else if (department && !departments.includes(department)) {
			department = '';
		}
	});

	function canGoNext() {
		if (step === 0) return isPreview ? !nicknameInputError : hasConfirmedNickname;
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

<main class="min-h-dvh bg-brand-bg px-5 pb-7 pt-[calc(1.75rem+env(safe-area-inset-top))] text-brand-text">
	<form
		method={isPreview ? undefined : 'POST'}
		action={isPreview ? undefined : '?/complete'}
		class="mx-auto flex min-h-[calc(100dvh-56px-env(safe-area-inset-top))] w-full max-w-[430px] flex-col"
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
			<div class="mb-5 flex items-center justify-between gap-3 rounded-[16px] border border-brand-border-strong bg-white px-3 py-2.5">
				<span class="flex items-center gap-2 text-sm font-black text-brand">
					<Eye size={17} strokeWidth={2.8} />
					미리보기
				</span>
				<a
					class="flex min-h-10 items-center gap-1.5 rounded-[12px] px-3 text-sm font-black text-brand-muted transition hover:bg-brand-map"
					href={exitHref}
				>
					<X size={16} strokeWidth={2.8} />
					미리보기 나가기
				</a>
			</div>
		{/if}

		<header>
			<p class="m-0 text-sm font-black text-brand-muted">하이브리드 온보딩</p>
			<h1 class="m-0 mt-2 text-3xl font-black">조금만 알려주세요</h1>
			<p class="mt-3 text-sm font-bold leading-6 text-brand-muted">
				입력한 정보는 골라바유 통계와 맞춤 기능을 위한 기준으로만 사용합니다.
			</p>
		</header>

		<div class="mt-7 flex gap-1.5">
			{#each steps as item, index}
				<div
					class={`h-2 flex-1 rounded-full ${index <= step ? 'bg-brand' : 'bg-brand-border-strong'}`}
					aria-label={item}
				></div>
			{/each}
		</div>

		{#if message}
			<p class="mt-5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
				{message}
			</p>
		{/if}

		<section class="mt-8 flex-1 rounded-[22px] border border-brand-border bg-white p-5 shadow-[0_18px_40px_rgba(103,16,43,0.08)]">
			{#if step === 0}
				<div class="grid gap-3">
					<label class="text-xl font-black" for="nickname">닉네임을 정해주세요</label>
					<div class={`grid gap-2 ${isPreview ? 'grid-cols-1' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
						<input
							bind:value={nickname}
							class="h-14 min-w-0 rounded-[16px] border border-brand-border-strong px-4 text-base font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
							id="nickname"
							maxlength="10"
							oninput={invalidateNicknameCheck}
							placeholder="닉네임 입력"
						/>
						{#if !isPreview}
							<button
								class="h-14 rounded-[16px] bg-brand px-4 text-sm font-black text-white disabled:bg-brand-border-strong"
								disabled={Boolean(nicknameInputError)}
								formaction="?/checkNickname"
								type="submit"
							>
								중복 확인
							</button>
						{/if}
					</div>
				</div>
				<p class="mt-3 text-xs font-bold leading-5 text-brand-muted">
					2~10자, 한글/영문/숫자/밑줄(_)만 사용 가능, 공백 및 특수문자 불가합니다.
				</p>
				{#if nicknameCheckResult}
					<p
						class={`mt-3 rounded-[14px] px-4 py-3 text-sm font-bold ${nicknameCheckResult.status === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}
						role="status"
						aria-live="polite"
					>
						{nicknameCheckResult.message}
					</p>
				{/if}
			{:else if step === 1}
				<div class="grid gap-3">
					<h2 class="m-0 text-xl font-black">단과대를 선택해주세요</h2>
					<div class="grid gap-2">
						{#each collegeOptions as option}
							<button
								class={`min-h-12 rounded-[14px] border px-4 text-left text-sm font-black ${college === option ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-text'}`}
								type="button"
								onclick={() => (college = option)}
							>
								{option}
							</button>
						{/each}
					</div>
				</div>
			{:else if step === 2}
				<div class="grid gap-3">
					<h2 class="m-0 text-xl font-black">학과를 선택해주세요</h2>
					{#if !college}
						<p class="rounded-[14px] bg-brand-map px-4 py-3 text-sm font-bold text-brand-muted">
							먼저 단과대를 선택해 주세요.
						</p>
					{:else}
						<div class="grid max-h-[52dvh] gap-2 overflow-y-auto pr-1">
							{#each departments as option}
								<button
									class={`min-h-12 rounded-[14px] border px-4 text-left text-sm font-black ${department === option ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-text'}`}
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
				<div class="grid gap-3">
					<h2 class="m-0 text-xl font-black">학번을 선택해주세요</h2>
					<div class="grid grid-cols-2 gap-2">
						{#each studentYearOptions as option}
							<button
								class={`h-12 rounded-[14px] border text-sm font-black ${studentYear === option ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-text'}`}
								type="button"
								onclick={() => (studentYear = option)}
							>
								{option}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<div class="grid gap-3">
					<h2 class="m-0 text-xl font-black">성별을 선택해주세요</h2>
					<div class="grid gap-2">
						{#each genderOptions as option}
							<button
								class={`h-14 rounded-[14px] border px-4 text-left text-sm font-black ${gender === option.value ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-text'}`}
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

		<footer class="mt-5 grid grid-cols-[auto_1fr] gap-2 pb-[max(0px,env(safe-area-inset-bottom))]">
			<button
				class="grid h-14 w-14 place-items-center rounded-[16px] border border-brand-border-strong bg-white text-brand-muted disabled:opacity-35"
				type="button"
				disabled={step === 0}
				onclick={prevStep}
				aria-label="이전"
			>
				<ChevronLeft size={22} strokeWidth={3} />
			</button>

			{#if step < steps.length - 1}
				<button
					class="flex h-14 items-center justify-center gap-2 rounded-[16px] bg-brand text-base font-black text-white disabled:bg-brand-border-strong"
					type="button"
					disabled={!canGoNext()}
					onclick={nextStep}
				>
					다음
					<ChevronRight size={18} strokeWidth={3} />
				</button>
			{:else}
				<button
					class="flex h-14 items-center justify-center gap-2 rounded-[16px] bg-brand text-base font-black text-white disabled:bg-brand-border-strong"
					type={isPreview ? 'button' : 'submit'}
					disabled={!canGoNext()}
					formaction={isPreview ? undefined : '?/complete'}
					onclick={isPreview ? showPreviewNotice : undefined}
				>
					<Check size={18} strokeWidth={3} />
					시작하기
				</button>
			{/if}
		</footer>
	</form>

	{#if isPreview}
		<div
			class={`pointer-events-none fixed inset-x-5 bottom-[calc(88px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-[390px] items-center gap-3 rounded-[16px] border border-brand bg-white px-4 py-3 text-sm font-black text-brand shadow-[0_12px_30px_rgba(116,17,47,0.16)] transition duration-200 ${previewNoticeVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
			role="status"
			aria-live="polite"
			aria-hidden={!previewNoticeVisible}
		>
			<Check size={18} strokeWidth={2.8} />
			미리보기에서는 정보가 저장되지 않습니다.
		</div>
	{/if}
</main>
