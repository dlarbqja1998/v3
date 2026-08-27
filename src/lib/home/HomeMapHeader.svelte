<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import MainBrandIcon from '$lib/brand/MainBrandIcon.svelte';
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
	let areaOptions = $derived(buildMapAreaOptions(zones));
	let selectedAreaLabel = $derived(
		areaOptions.find((option) => option.id === selectedAreaId)?.name ?? areaOptions[0]?.name ?? ''
	);
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
			dropdownElement?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []
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

<header class="pointer-events-auto relative z-30 border-b border-brand-border bg-white">
	<div
		class="grid h-[calc(56px+env(safe-area-inset-top))] grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 px-4 pt-[env(safe-area-inset-top)]"
	>
		<MainBrandIcon />

		{#if searchOpen}
			<div class="min-w-0">
				<input
					bind:this={searchInput}
					class="h-11 w-full border-b-2 border-brand bg-transparent px-1 text-[15px] font-bold outline-none placeholder:text-brand-muted/70"
					type="search"
					value={searchQuery}
					placeholder={searchPlaceholder}
					aria-label="시설 검색어"
					oninput={(event) => onSearchQueryChange(event.currentTarget.value)}
				/>
			</div>
		{:else}
		<div class="relative min-w-0" bind:this={dropdownElement}>
			<button
				bind:this={triggerElement}
				type="button"
				class="relative flex h-11 w-full items-center justify-center px-7 text-center text-[16px] font-bold tracking-[-0.02em] text-brand-text outline-none transition-colors duration-150 hover:text-brand focus-visible:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
				aria-label={`지도 구역: ${selectedAreaLabel}`}
				aria-haspopup="listbox"
				aria-expanded={menuOpen}
				aria-controls="home-map-area-listbox"
				onclick={toggleMenu}
				onkeydown={handleTriggerKeydown}
			>
				<span class="block w-full truncate text-center">{selectedAreaLabel}</span>
			</button>
			<AppIcon
				name="chevron"
				size={20}
				class={`pointer-events-none absolute right-1 top-[22px] -translate-y-1/2 text-brand-muted transition-transform duration-150 ${menuOpen ? 'rotate-90' : '-rotate-90'}`}
			/>

			{#if menuOpen}
				<div
					id="home-map-area-listbox"
					class="absolute left-1/2 top-[calc(100%+1px)] z-50 max-h-[min(360px,58dvh)] w-[min(calc(100vw-32px),360px)] -translate-x-1/2 overflow-y-auto rounded-b-[14px] border-x border-b border-brand-border bg-white shadow-[0_10px_20px_rgba(72,12,31,0.12)]"
					role="listbox"
					tabindex="-1"
					aria-label="지도 구역 선택"
					onkeydown={handleMenuKeydown}
					transition:fly={{ y: -6, duration: 140 }}
				>
					{#each areaOptions as option}
						<button
							type="button"
							class={`flex min-h-[52px] w-full items-center justify-center border-b border-brand-border px-4 py-2 text-center text-[15px] tracking-[-0.015em] outline-none transition-colors duration-150 last:border-b-0 focus-visible:bg-brand-soft focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-brand/25 ${
								selectedAreaId === option.id
									? 'font-bold text-brand'
									: 'font-medium text-brand-muted hover:bg-brand-surface hover:text-brand-text'
							}`}
							role="option"
							aria-selected={selectedAreaId === option.id}
							onclick={() => selectArea(option.id)}
						>
							{option.name}
						</button>
					{/each}
				</div>
			{/if}
		</div>
		{/if}

		<button
			class="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-brand-muted transition-colors hover:bg-brand-surface hover:text-brand focus-visible:bg-brand-soft focus-visible:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
			type="button"
			aria-label={searchOpen ? '시설 검색 닫기' : '시설 검색'}
			onclick={() => (searchOpen ? closeSearch() : onSearchOpenChange(true))}
		>
			<AppIcon name={searchOpen ? 'clear' : 'search'} size={20} />
		</button>
	</div>
</header>
