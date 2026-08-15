<script lang="ts">
	import { Check, ChevronLeft } from '@lucide/svelte';
	import {
		buildDepartmentOptions,
		collegeOptions,
		genderOptions,
		studentYearOptions,
		type OnboardingInput
	} from '$lib/domain/onboarding';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submittedValues = $derived(
		(form && 'values' in form ? form.values : data.values) as OnboardingInput
	);
	let nickname = $state('');
	let college = $state('');
	let department = $state('');
	let studentYear = $state('');
	let gender = $state('');
	let departments = $derived(college ? buildDepartmentOptions(college) : []);

	$effect(() => {
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
</script>

<svelte:head>
	<title>내 정보 수정 | 골라바유</title>
</svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="relative min-h-dvh w-full overflow-hidden bg-brand-surface shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong"
		aria-label="내 정보 수정"
	>
		<form
			method="POST"
			class="h-full min-h-dvh overflow-y-auto px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-7 md:min-h-[min(860px,calc(100vh-48px))]"
		>
			<input type="hidden" name="department" value={department} />

			<header class="flex items-start justify-between gap-4">
				<div>
					<p class="m-0 text-sm font-black text-brand-muted">마이</p>
					<h1 class="m-0 mt-2 text-3xl font-black">내 정보 수정</h1>
				</div>
				<a
					class="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-brand-border bg-white text-brand-muted"
					href="/my"
					aria-label="마이페이지로 돌아가기"
				>
					<ChevronLeft size={22} strokeWidth={2.8} />
				</a>
			</header>

			{#if form?.message}
				<p class="mt-5 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
					{form.message}
				</p>
			{/if}

			<section class="mt-6 grid gap-4 rounded-[22px] border border-brand-border bg-white p-5">
				<label class="grid gap-2">
					<span class="text-sm font-black">닉네임</span>
					<input
						bind:value={nickname}
						class="h-13 rounded-[14px] border border-brand-border-strong px-4 text-sm font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						maxlength="10"
						name="nickname"
						placeholder="최대 10글자"
					/>
				</label>

				<label class="grid gap-2">
					<span class="text-sm font-black">단과대</span>
					<select
						bind:value={college}
						class="h-13 rounded-[14px] border border-brand-border-strong bg-white px-4 text-sm font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						name="college"
					>
						<option value="">선택</option>
						{#each collegeOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</label>

				<label class="grid gap-2">
					<span class="text-sm font-black">학과</span>
					<select
						bind:value={department}
						class="h-13 rounded-[14px] border border-brand-border-strong bg-white px-4 text-sm font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-brand-map"
						disabled={!college || college === '그 외'}
					>
						<option value="">선택</option>
						{#each departments as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</label>

				<label class="grid gap-2">
					<span class="text-sm font-black">학번</span>
					<select
						bind:value={studentYear}
						class="h-13 rounded-[14px] border border-brand-border-strong bg-white px-4 text-sm font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						name="studentYear"
					>
						<option value="">선택</option>
						{#each studentYearOptions as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				</label>

				<label class="grid gap-2">
					<span class="text-sm font-black">성별</span>
					<select
						bind:value={gender}
						class="h-13 rounded-[14px] border border-brand-border-strong bg-white px-4 text-sm font-bold outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						name="gender"
					>
						<option value="">선택</option>
						{#each genderOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</label>
			</section>

			<button
				class="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-brand text-base font-black text-white"
				type="submit"
			>
				<Check size={18} strokeWidth={2.8} />
				저장하기
			</button>
		</form>

		<BottomNavigation
			activeKey="my"
			containerClass="absolute inset-x-0 bottom-0 z-30"
			isAuthenticated={true}
		/>
	</section>
</main>
