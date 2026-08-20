<script lang="ts">
	import { SlidersHorizontal, X } from '@lucide/svelte';
	import {
		getOutsideCuisineLabel,
		outsideCuisineOptions,
		outsidePlaceCategoryOptions,
		type OutsideCuisine,
		type OutsidePlaceCategory
	} from '$lib/domain/outside-place-filters';

	let {
		selectedCategory,
		selectedCuisine,
		onCategoryChange,
		onCuisineChange
	}: {
		selectedCategory: OutsidePlaceCategory;
		selectedCuisine: OutsideCuisine;
		onCategoryChange: (category: OutsidePlaceCategory) => void;
		onCuisineChange: (cuisine: OutsideCuisine) => void;
	} = $props();

	let filterOpen = $state(false);
	let filterLabel = $derived(
		selectedCuisine === 'all' ? '필터' : getOutsideCuisineLabel(selectedCuisine)
	);

	function chipClass(isActive: boolean) {
		const base =
			'shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-black transition-colors';
		return isActive
			? `${base} border-brand bg-brand text-white shadow-[0_6px_14px_rgba(103,16,43,0.18)]`
			: `${base} border-brand-border-strong bg-white text-brand-muted`;
	}

	function selectCategory(category: OutsidePlaceCategory) {
		onCategoryChange(category);
		if (category !== 'restaurant' && selectedCuisine !== 'all') onCuisineChange('all');
	}

	function selectCuisine(cuisine: OutsideCuisine) {
		onCuisineChange(cuisine);
		filterOpen = false;
	}
</script>

<nav
	class="pointer-events-auto relative z-20 flex gap-2 overflow-x-auto px-4 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
	aria-label="학교 밖 장소 카테고리"
>
	{#each outsidePlaceCategoryOptions as option}
		<button
			class={chipClass(selectedCategory === option.value)}
			type="button"
			aria-pressed={selectedCategory === option.value}
			onclick={() => selectCategory(option.value)}
		>
			{option.label}
		</button>
	{/each}
	<button
		class={`${chipClass(selectedCuisine !== 'all')} flex items-center gap-1.5 disabled:cursor-not-allowed disabled:opacity-45`}
		type="button"
		aria-pressed={selectedCuisine !== 'all'}
		disabled={selectedCategory !== 'restaurant'}
		onclick={() => (filterOpen = true)}
	>
		<SlidersHorizontal size={14} strokeWidth={2.8} />
		{filterLabel}
	</button>
</nav>

{#if filterOpen}
	<div class="pointer-events-auto absolute inset-0 z-40" role="presentation">
		<button
			class="absolute inset-0 h-full w-full bg-brand-dark/25 backdrop-blur-[1px]"
			type="button"
			aria-label="음식 종류 필터 닫기"
			onclick={() => (filterOpen = false)}
		></button>
		<div
			class="absolute inset-x-3 bottom-[calc(var(--bottom-navigation-height)+12px)] rounded-[24px] border border-brand-border-strong bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-[0_22px_50px_rgba(72,12,31,0.24)]"
			role="dialog"
			aria-modal="true"
			aria-labelledby="outside-cuisine-filter-title"
		>
			<header class="mb-4 flex items-center justify-between gap-3">
				<div>
					<p class="m-0 text-xs font-black text-brand-muted">음식점 상세 필터</p>
					<h2 id="outside-cuisine-filter-title" class="m-0 mt-1 text-xl font-black">음식 종류</h2>
				</div>
				<button
					class="grid h-10 w-10 place-items-center rounded-full border border-brand-border bg-brand-surface text-brand-muted"
					type="button"
					aria-label="닫기"
					onclick={() => (filterOpen = false)}
				>
					<X size={18} strokeWidth={2.8} />
				</button>
			</header>

			<div class="grid grid-cols-2 gap-2">
				{#each outsideCuisineOptions as option}
					<button
						class={`min-h-12 rounded-[14px] border px-3 text-sm font-black ${
							selectedCuisine === option.value
								? 'border-brand bg-brand text-white'
								: 'border-brand-border bg-brand-surface text-brand-text'
						}`}
						type="button"
						aria-pressed={selectedCuisine === option.value}
						onclick={() => selectCuisine(option.value)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
