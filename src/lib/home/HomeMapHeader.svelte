<script lang="ts">
	import { onMount, tick } from 'svelte';
	import {
		buildMapAreaOptions,
		type CommercialZone
	} from '$lib/domain/commercial-zones';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { getFacilitySearchPlaceholder } from '$lib/home/facility-discovery';

	let {
		zones,
		selectedAreaId,
		searchOpen = false,
		searchQuery = '',
		campusDirectorySearch = false,
		outsideEnabled = false,
		onSearchOpenChange = () => undefined,
		onSearchQueryChange = () => undefined
	}: {
		zones: CommercialZone[];
		selectedAreaId: string;
		searchOpen?: boolean;
		searchQuery?: string;
		campusDirectorySearch?: boolean;
		outsideEnabled?: boolean;
		onSearchOpenChange?: (open: boolean) => void;
		onSearchQueryChange?: (query: string) => void;
	} = $props();

	let searchInput = $state<HTMLInputElement>();
	let areaOptions = $derived(buildMapAreaOptions(zones, { outsideEnabled, includeOutsideAll: true }));
	let selectedArea = $derived(
		areaOptions.find((option) => option.id === selectedAreaId) ?? areaOptions[0]
	);
	let selectedAreaLabel = $derived(selectedArea?.name ?? '');
	let selectedAreaShortLabel = $derived(selectedArea?.shortName ?? selectedAreaLabel);
	let searchLabel = $derived(selectedArea?.mode === 'outside' && outsideEnabled ? '음식점 검색' : '시설 검색');
	let searchPlaceholder = $derived(
		selectedArea?.mode === 'outside' && outsideEnabled
			? '매장명·주소 검색'
			: campusDirectorySearch ? '시설명·이용 목적 검색' : getFacilitySearchPlaceholder('campus', selectedAreaLabel)
	);

	$effect(() => {
		if (!searchOpen) return;
		void tick().then(() => searchInput?.focus());
	});

	function closeSearch() {
		onSearchOpenChange(false);
	}

	onMount(() => {
		function handleDocumentKeydown(event: KeyboardEvent) {
			if (searchOpen && event.key === 'Escape') {
				event.preventDefault();
				closeSearch();
			}
		}

		document.addEventListener('keydown', handleDocumentKeydown);

		return () => {
			document.removeEventListener('keydown', handleDocumentKeydown);
		};
	});
</script>

<header class="pointer-events-auto relative z-30 pt-[env(safe-area-inset-top)]">
	<div class="flex h-14 items-center gap-2 px-5 py-2.5">
		<img
			class="h-9 w-9 shrink-0 object-contain"
			src="/icon.png"
			alt="골라바유"
		/>

		{#if searchOpen}
			<div
				class="relative min-w-0 flex-1"
				role="search"
				aria-label={searchLabel}
			>
				<AppIcon
					name="search"
					size={20}
					class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-brand-text"
				/>
				<input
					bind:this={searchInput}
					class={`h-9 w-full rounded-[18px] bg-white pl-11 pr-10 ${campusDirectorySearch || selectedArea?.mode === 'outside' ? 'text-[16px]' : 'text-[12px]'} font-normal text-brand-text shadow-[0_1px_2px_rgba(25,24,26,0.05)] outline-none placeholder:text-[#c9c6ca] focus-visible:ring-2 focus-visible:ring-brand/25`}
					type="search"
					value={searchQuery}
					placeholder={searchPlaceholder}
					aria-label={`${searchLabel}어`}
					oninput={(event) => onSearchQueryChange(event.currentTarget.value)}
				/>
				<button
					class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
					type="button"
					aria-label={`${searchLabel} 닫기`}
					onclick={closeSearch}
				>
					<AppIcon name="clear" size={20} />
				</button>
			</div>
		{:else}
			<div
				class="flex h-9 min-w-0 flex-1 items-center justify-center px-1 text-[16px] font-bold tracking-[-0.03em] text-brand-text"
				role="status"
				aria-live="polite"
				aria-atomic="true"
				aria-label={`지도 구역: ${selectedAreaLabel}`}
			>
				{#key selectedAreaId}
				<span class="area-label min-w-0 truncate">
					<span class="min-[390px]:hidden">{selectedAreaShortLabel}</span>
					<span class="hidden min-[390px]:inline">{selectedAreaLabel}</span>
				</span>
				{/key}
			</div>

			<div class="flex shrink-0 items-center gap-2">
				<a
					class="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-text shadow-[0_1px_2px_rgba(25,24,26,0.05)] transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
					href="/shops"
					aria-label="상점"
				>
					<AppIcon name="shop" size={20} />
				</a>
				<button
					class="grid h-9 w-9 place-items-center rounded-full bg-white text-brand-text shadow-[0_1px_2px_rgba(25,24,26,0.05)] transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
					type="button"
					aria-label={searchLabel}
					onclick={() => onSearchOpenChange(true)}
				>
					<AppIcon name="search" size={20} />
				</button>
			</div>
		{/if}
	</div>
</header>

<style>
	.area-label { animation: area-label-enter 160ms ease-out; }
	@keyframes area-label-enter {
		from { opacity: 0; transform: translateY(2px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.area-label { animation: none; }
	}
</style>
