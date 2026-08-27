<script lang="ts">
	import OnboardingFlow from '$lib/onboarding/OnboardingFlow.svelte';
	import type { OnboardingInput } from '$lib/domain/onboarding';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	type NicknameCheck = {
		nickname: string;
		status: 'available' | 'duplicate' | 'invalid' | 'error';
		message: string;
	};

	let submittedValues = $derived(
		(form && 'values' in form ? form.values : null) as OnboardingInput | null
	);
	let nicknameCheck = $derived(
		(form && 'nicknameCheck' in form ? form.nicknameCheck : null) as NicknameCheck | null
	);
	let next = $derived((form && 'next' in form ? form.next : data.next) as string);
</script>

<svelte:head>
	<title>온보딩 | 골라바유</title>
</svelte:head>

<OnboardingFlow
	mode="register"
	message={form && 'message' in form ? form.message ?? null : null}
	{submittedValues}
	{nicknameCheck}
	{next}
/>
