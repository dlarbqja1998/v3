<script lang="ts">
	import { FACILITY_CATEGORIES } from '$lib/domain/facility-categories';
	import AppIcon from '$lib/icon/AppIcon.svelte';

	let {
		selectedCategory,
		onCategoryChange
	}: {
		selectedCategory: string;
		onCategoryChange: (category: string) => void;
	} = $props();
</script>

<nav class="pointer-events-auto border-b border-brand-border bg-white" aria-label="시설 카테고리">
	<div class="flex snap-x gap-1 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
		{#each FACILITY_CATEGORIES as category}
			<button
				class={`relative flex h-12 shrink-0 snap-start items-center gap-1.5 px-3 text-[13px] transition-colors duration-200 ${selectedCategory === category.slug ? 'font-black text-brand' : 'font-bold text-brand-muted'}`}
				type="button"
				aria-pressed={selectedCategory === category.slug}
				onclick={() => onCategoryChange(category.slug)}
			>
				<AppIcon name={category.icon} size={20} />
				{category.name}
				<span class={`absolute inset-x-2 bottom-0 h-0.5 bg-brand transition-transform duration-200 ${selectedCategory === category.slug ? 'scale-x-100' : 'scale-x-0'}`}></span>
			</button>
		{/each}
	</div>
</nav>
