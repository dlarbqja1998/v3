<script lang="ts">
	import { CalendarDays } from '@lucide/svelte';
	import { FACILITY_CATEGORIES } from '$lib/domain/facility-categories';
	import { getHomeEventFilterOrder } from '$lib/home/home-events';
	import AppIcon, { type AppIconName } from '$lib/icon/AppIcon.svelte';

	let {
		selectedCategory,
		onCategoryChange
	}: {
		selectedCategory: string;
		onCategoryChange: (category: string) => void;
	} = $props();
	const categories = getHomeEventFilterOrder(FACILITY_CATEGORIES);
</script>

<nav class="pointer-events-auto relative z-20 bg-transparent" aria-label="시설 카테고리">
	<div class="flex snap-x gap-2 overflow-x-auto px-5 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
		{#each categories as category}
			<button
				class={`flex h-9 shrink-0 snap-start items-center gap-1.5 rounded-[14px] border px-3 text-[13px] shadow-[0_1px_2px_rgba(25,24,26,0.04)] transition-[color,background-color,border-color] duration-200 ${selectedCategory === category.slug ? 'border-brand bg-brand font-black text-white' : 'border-brand-border bg-white font-bold text-brand-muted'}`}
				type="button"
				aria-pressed={selectedCategory === category.slug}
				onclick={() => onCategoryChange(category.slug)}
			>
				{#if category.slug === 'event'}<CalendarDays size={19} />{:else}<AppIcon name={category.icon as AppIconName} size={20} />{/if}
				{category.name}
			</button>
		{/each}
	</div>
</nav>
