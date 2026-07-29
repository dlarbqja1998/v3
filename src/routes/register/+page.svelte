<script lang="ts">
	import { Check, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import {
		buildDepartmentOptions,
		collegeOptions,
		genderOptions,
		studentYearOptions,
		type OnboardingInput
	} from '$lib/domain/onboarding';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let step = $state(0);
	let nickname = $state('');
	let college = $state('');
	let department = $state('');
	let studentYear = $state('');
	let gender = $state('');
	let departments = $derived(college ? buildDepartmentOptions(college) : []);
	let submittedValues = $derived(
		(form && 'values' in form ? form.values : null) as OnboardingInput | null
	);

	const steps = ['닉네임', '단과대', '학과', '학번', '성별'];

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
		if (step === 0) return nickname.trim().length > 0 && nickname.trim().length <= 10;
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
</script>

<svelte:head>
	<title>온보딩 | 골라바유</title>
</svelte:head>

<main class="min-h-dvh bg-brand-bg px-5 py-7 text-brand-text">
	<form method="POST" class="mx-auto flex min-h-[calc(100dvh-56px)] w-full max-w-[430px] flex-col">
		<input type="hidden" name="nickname" value={nickname} />
		<input type="hidden" name="college" value={college} />
		<input type="hidden" name="department" value={department} />
		<input type="hidden" name="studentYear" value={studentYear} />
		<input type="hidden" name="gender" value={gender} />

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

		{#if form?.message}
			<p class="mt-5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
				{form.message}
			</p>
		{/if}

		<section class="mt-8 flex-1 rounded-[22px] border border-brand-border bg-white p-5 shadow-[0_18px_40px_rgba(103,16,43,0.08)]">
			{#if step === 0}
				<label class="grid gap-3">
					<span class="text-xl font-black">닉네임을 정해주세요</span>
					<input
						bind:value={nickname}
						class="h-14 rounded-[16px] border border-brand-border-strong px-4 text-base font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						maxlength="10"
						placeholder="최대 10글자"
					/>
				</label>
				<p class="mt-3 text-xs font-bold text-brand-muted">중복 닉네임은 완료 시점에 한 번 더 확인합니다.</p>
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
					type="submit"
					disabled={!canGoNext()}
				>
					<Check size={18} strokeWidth={3} />
					시작하기
				</button>
			{/if}
		</footer>
	</form>
</main>
