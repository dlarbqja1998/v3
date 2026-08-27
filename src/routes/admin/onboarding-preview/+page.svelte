<script lang="ts">
	import OnboardingFlow from '$lib/onboarding/OnboardingFlow.svelte';
	import type { OnboardingInput } from '$lib/domain/onboarding';

	type NicknameCheck = {
		nickname: string;
		status: 'available' | 'duplicate' | 'invalid' | 'error';
		message: string;
	};

	type PreviewForm = {
		nicknameCheck?: NicknameCheck;
		values?: OnboardingInput;
	} | null;

	let { form = null }: { form?: PreviewForm } = $props();
	let submittedValues = $derived(form?.values ?? null);
	let nicknameCheck = $derived(form?.nicknameCheck ?? null);
</script>

<svelte:head>
	<title>온보딩 미리보기 | 골라바유</title>
</svelte:head>

<OnboardingFlow mode="preview" exitHref="/my" {submittedValues} {nicknameCheck} />
