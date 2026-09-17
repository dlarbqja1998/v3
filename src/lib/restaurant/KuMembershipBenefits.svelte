<script lang="ts">
	import type { KuMembership } from '$lib/domain/restaurants';
	let { membership }: {membership:KuMembership} = $props();
	const additionalBenefits = $derived(membership.benefits.filter(benefit => benefit !== membership.summary));
	const conditions = $derived(membership.conditions.filter(condition => !condition.includes('고려대학교 세종캠퍼스 학생증을 제시')));
</script>

<section class="gb1-section" aria-label="KU멤버십 혜택">
	<div class="flex items-center justify-between gap-3">
		<h2 class="gb1-section-title text-brand">KU멤버십 혜택</h2>
		<span class="text-[12px] text-brand-muted">{membership.periodLabel}</span>
	</div>
	<p class="m-0 mt-3 break-keep text-[20px] font-bold leading-7 text-brand-text">{membership.summary}</p>
	{#if additionalBenefits.length}
		<ul class="m-0 mt-3 space-y-2 pl-4 text-[13px] leading-6 marker:text-brand list-disc">
			{#each additionalBenefits as benefit}<li class="break-keep">{benefit}</li>{/each}
		</ul>
	{/if}
	{#each conditions as condition}<p class="m-0 mt-3 break-keep text-[13px] leading-5 text-brand-muted">{condition}</p>{/each}
</section>
