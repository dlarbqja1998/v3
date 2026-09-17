<script lang="ts">
	import { FACILITY_CATEGORIES } from '$lib/domain/facility-categories';
	import { getHomeEventFilterOrder } from '$lib/home/home-events';

	let {
		selectedCategory,
		showCampusDirectory = false,
		onCategoryChange
	}: {
		selectedCategory: string;
		showCampusDirectory?: boolean;
		onCategoryChange: (category: string) => void;
	} = $props();
	const categories = $derived(showCampusDirectory
		? [{ slug: 'student-support', name: '학생지원', icon: 'administration' }, ...getHomeEventFilterOrder(FACILITY_CATEGORIES)]
		: getHomeEventFilterOrder(FACILITY_CATEGORIES));
</script>

<nav class="pointer-events-auto relative z-20 bg-transparent" aria-label="시설 카테고리">
	<div class="flex h-11 gap-1 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
		{#each categories as category}
			<button
				class={`map-filter-option min-h-11 min-w-11 shrink-0 whitespace-nowrap px-2 transition-colors duration-200 ${selectedCategory === category.slug ? 'font-bold text-brand' : 'text-brand-muted'}`}
				type="button"
				aria-pressed={selectedCategory === category.slug}
				onclick={(event) => {
					onCategoryChange(category.slug);
					event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
				}}
			>
				{category.name}
			</button>
		{/each}
	</div>
</nav>
