<script lang="ts">
	import {
		outsideCuisineOptions, outsidePlaceCategoryOptions,
		type OutsideCuisine, type OutsidePlaceCategory
	} from '$lib/domain/outside-place-filters';

	let {
		selectedCategory, selectedCuisine, membershipOnly = false,
		onCategoryChange, onCuisineChange, onMembershipChange = () => undefined
	}: {
		selectedCategory: OutsidePlaceCategory; selectedCuisine: OutsideCuisine; membershipOnly?: boolean;
		onCategoryChange: (value: OutsidePlaceCategory) => void;
		onCuisineChange: (value: OutsideCuisine) => void;
		onMembershipChange?: (value: boolean) => void;
	} = $props();
	const selectedIndex = $derived(Math.max(0, outsidePlaceCategoryOptions.findIndex(option => option.value === selectedCategory)));
</script>

<nav class="pointer-events-auto relative z-20 bg-transparent" aria-label="교외 가게 종류">
	<div class="relative mx-5 grid grid-cols-4 border-b border-brand-border">
		{#each outsidePlaceCategoryOptions as option}
			<button type="button" class={`map-filter-option h-11 transition-colors duration-200 ${selectedCategory === option.value ? 'font-bold text-brand' : 'text-brand-muted'}`}
				aria-pressed={selectedCategory === option.value} onclick={() => onCategoryChange(option.value)}>{option.label}</button>
		{/each}
		<span aria-hidden="true" class="absolute -bottom-px h-0.5 w-1/4 bg-brand transition-transform duration-[250ms] motion-reduce:transition-none" style:transform={`translateX(${selectedIndex * 100}%)`}></span>
	</div>
	{#if selectedCategory === 'restaurant'}
		<div class="flex h-11 gap-1 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="음식 종류">
			{#each outsideCuisineOptions as option}
				<button type="button" class={`map-filter-option min-h-11 min-w-11 shrink-0 whitespace-nowrap px-2 transition-colors duration-200 ${selectedCuisine === option.value ? 'font-bold text-brand' : 'text-brand-muted'}`}
					aria-pressed={selectedCuisine === option.value}
					onclick={(event) => {
						onCuisineChange(option.value);
						event.currentTarget.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
					}}>{option.value === 'all' ? '전체' : option.label}</button>
			{/each}
		</div>
	{/if}
	<label class="mx-5 flex min-h-11 w-fit cursor-pointer items-center gap-1.5 text-[12px] text-brand-muted has-checked:text-brand">
		<input type="checkbox" class="m-0 size-3.5 accent-brand" aria-label="KU멤버십만 보기" checked={membershipOnly} onchange={(event) => onMembershipChange(event.currentTarget.checked)} />
		KU멤버십만
	</label>
</nav>
