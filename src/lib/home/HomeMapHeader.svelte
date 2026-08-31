<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import {
		buildMapAreaOptions,
		type CommercialZone
	} from '$lib/domain/commercial-zones';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { getFacilitySearchPlaceholder } from '$lib/home/facility-discovery';

	let {
		zones,
		selectedAreaId,
		onAreaChange,
		searchOpen = false,
		searchQuery = '',
		onSearchOpenChange = () => undefined,
		onSearchQueryChange = () => undefined
	}: {
		zones: CommercialZone[];
		selectedAreaId: string;
		onAreaChange: (areaId: string) => void;
		searchOpen?: boolean;
		searchQuery?: string;
		onSearchOpenChange?: (open: boolean) => void;
		onSearchQueryChange?: (query: string) => void;
	} = $props();

	let menuOpen = $state(false);
	let dropdownElement = $state<HTMLDivElement>();
	let triggerElement = $state<HTMLButtonElement>();
	let searchInput = $state<HTMLInputElement>();
	let areaOptions = $derived(buildMapAreaOptions(zones, { outsideEnabled: false }));
	let selectedArea = $derived(
		areaOptions.find((option) => option.id === selectedAreaId) ?? areaOptions[0]
	);
	let selectedAreaLabel = $derived(selectedArea?.name ?? '');
	let selectedAreaShortLabel = $derived(selectedArea?.shortName ?? selectedAreaLabel);
	let searchPlaceholder = $derived(
		getFacilitySearchPlaceholder(selectedAreaId === 'campus' ? 'campus' : 'outside', selectedAreaLabel)
	);

	$effect(() => {
		if (!searchOpen) return;
		void tick().then(() => searchInput?.focus());
	});

	function closeSearch() {
		onSearchOpenChange(false);
	}

	function getOptionElements() {
		return Array.from(
			dropdownElement?.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)') ?? []
		);
	}

	async function openMenu(focus: 'selected' | 'first' | 'last' = 'selected') {
		menuOpen = true;
		await tick();

		const options = getOptionElements();
		const focusTarget =
			focus === 'first'
				? options[0]
				: focus === 'last'
					? options.at(-1)
					: options.find((option) => option.getAttribute('aria-selected') === 'true');

		focusTarget?.focus();
	}

	function closeMenu(restoreFocus = false) {
		menuOpen = false;
		if (restoreFocus) triggerElement?.focus();
	}

	function toggleMenu() {
		if (menuOpen) {
			closeMenu();
			return;
		}

		void openMenu();
	}

	function selectArea(areaId: string) {
		const option = areaOptions.find((candidate) => candidate.id === areaId);
		if (!option || option.disabled) return;
		if (areaId !== selectedAreaId) onAreaChange(areaId);
		closeMenu(true);
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

		event.preventDefault();
		void openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
	}

	function handleMenuKeydown(event: KeyboardEvent) {
		const options = getOptionElements();
		const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);

		if (event.key === 'Tab') {
			closeMenu();
			return;
		}

		let nextIndex: number | null = null;
		if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
		if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
		if (event.key === 'Home') nextIndex = 0;
		if (event.key === 'End') nextIndex = options.length - 1;

		if (nextIndex === null) return;
		event.preventDefault();
		options[nextIndex]?.focus();
	}

	onMount(() => {
		function handlePointerDown(event: PointerEvent) {
			if (menuOpen && dropdownElement && !dropdownElement.contains(event.target as Node)) closeMenu();
		}

		function handleDocumentKeydown(event: KeyboardEvent) {
			if (menuOpen && event.key === 'Escape') {
				event.preventDefault();
				closeMenu(true);
			}
			if (searchOpen && event.key === 'Escape') {
				event.preventDefault();
				closeSearch();
			}
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleDocumentKeydown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
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
				aria-label="시설 검색"
			>
				<AppIcon
					name="search"
					size={20}
					class="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-brand-text"
				/>
				<input
					bind:this={searchInput}
					class="h-9 w-full rounded-[18px] bg-white pl-11 pr-10 text-[12px] font-normal text-brand-text shadow-[0_1px_2px_rgba(25,24,26,0.05)] outline-none placeholder:text-[#c9c6ca] focus-visible:ring-2 focus-visible:ring-brand/25"
					type="search"
					value={searchQuery}
					placeholder={searchPlaceholder}
					aria-label="시설 검색어"
					oninput={(event) => onSearchQueryChange(event.currentTarget.value)}
				/>
				<button
					class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
					type="button"
					aria-label="시설 검색 닫기"
					onclick={closeSearch}
				>
					<AppIcon name="clear" size={20} />
				</button>
			</div>
		{:else}
			<div class="relative min-w-0 flex-1" bind:this={dropdownElement}>
				<button
					bind:this={triggerElement}
					type="button"
					class="relative z-20 flex h-9 w-full items-center gap-2 rounded-[18px] bg-white px-4 text-center text-[13px] font-medium tracking-[-0.01em] text-brand-text shadow-[0_1px_2px_rgba(25,24,26,0.05)] outline-none transition-colors duration-150 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
					aria-label={`지도 구역: ${selectedAreaLabel}`}
					aria-haspopup="listbox"
					aria-expanded={menuOpen}
					aria-controls="home-map-area-listbox"
					onclick={toggleMenu}
					onkeydown={handleTriggerKeydown}
				>
					<span class="block min-w-0 flex-1 truncate text-center">
						<span class="min-[390px]:hidden">{selectedAreaShortLabel}</span>
						<span class="hidden min-[390px]:inline">{selectedAreaLabel}</span>
					</span>
					<AppIcon
						name="chevron"
						size={20}
						class={`shrink-0 text-brand-muted transition-transform duration-150 ${menuOpen ? 'rotate-90' : '-rotate-90'}`}
					/>
				</button>

				{#if menuOpen}
					<div
						id="home-map-area-listbox"
						class="absolute left-0 top-7 z-10 w-[min(260px,calc(100vw-80px))] max-h-[min(360px,58dvh)] overflow-y-auto rounded-b-[18px] bg-white pt-2 shadow-[0_8px_18px_rgba(25,24,26,0.08)]"
						role="listbox"
						tabindex="-1"
						aria-label="지도 구역 선택"
						onkeydown={handleMenuKeydown}
						transition:fly={{ y: -6, duration: 140 }}
					>
						{#each areaOptions as option}
							<button
								type="button"
								class={`grid min-h-10 w-full items-center px-4 py-2 text-[13px] tracking-[-0.01em] outline-none transition-colors duration-150 focus-visible:bg-brand-soft focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-brand/25 ${
									option.disabled
										? 'grid-cols-[minmax(0,1fr)_auto] gap-3 text-left'
										: 'grid-cols-[1fr_auto_1fr] text-center'
								} ${
									selectedAreaId === option.id
										? 'font-medium text-brand'
										: option.disabled
											? 'cursor-not-allowed font-medium text-brand-muted'
											: 'font-medium text-brand-text hover:bg-brand-surface'
								}`}
								role="option"
								aria-selected={selectedAreaId === option.id}
								aria-disabled={option.disabled}
								disabled={option.disabled}
								onclick={() => selectArea(option.id)}
							>
								{#if option.disabled}
									<span class="min-w-0">
										<span class="block font-medium text-brand-text">{option.name}</span>
										{#if option.description}
											<span class="mt-0.5 block break-keep text-[11px] leading-4 text-brand-muted">
												{option.description}
											</span>
										{/if}
									</span>
									<span class="shrink-0 justify-self-end rounded-full bg-brand-map px-2 py-1 text-[10px] font-bold text-brand-muted">
										{option.badge}
									</span>
								{:else}
									<span aria-hidden="true"></span>
									<span>{option.name}</span>
									<span aria-hidden="true"></span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
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
					aria-label="시설 검색"
					onclick={() => onSearchOpenChange(true)}
				>
					<AppIcon name="search" size={20} />
				</button>
			</div>
		{/if}
	</div>
</header>
