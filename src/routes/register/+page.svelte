<script lang="ts">
	import OnboardingFlow from '$lib/onboarding/OnboardingFlow.svelte';
	import type { OnboardingInput } from '$lib/domain/onboarding';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let submittedValues = $derived(
		(form && 'values' in form ? form.values : null) as OnboardingInput | null
	);
</script>

<svelte:head>
	<title>온보딩 | 골라바유</title>
</svelte:head>

<OnboardingFlow mode="register" message={form?.message ?? null} {submittedValues} />
