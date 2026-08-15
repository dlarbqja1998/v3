<script lang="ts">
	import MainBrandIcon from '$lib/brand/MainBrandIcon.svelte';
	import type { CommercialZone, MapAreaMode } from '$lib/domain/commercial-zones';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';

	let {
		areaMode,
		zones,
		selectedZoneId,
		onAreaModeChange,
		onZoneChange
	}: {
		areaMode: MapAreaMode;
		zones: CommercialZone[];
		selectedZoneId: string;
		onAreaModeChange: (mode: MapAreaMode) => void;
		onZoneChange: (zoneId: string) => void;
	} = $props();

	const areaModes: { value: MapAreaMode; label: string }[] = [
		{ value: 'campus', label: '학교안' },
		{ value: 'outside', label: '학교밖' }
	];

	let menuOpen = $state(false);
	let dropdownElement: HTMLDivElement;
	let triggerElement: HTMLButtonElement;

	const selectedAreaLabel = $derived(
		areaModes.find((mode) => mode.value === areaMode)?.label ?? '학교안'
	);

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

	function selectAreaMode(mode: MapAreaMode) {
		if (mode !== areaMode) onAreaModeChange(mode);
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
			if (menuOpen && !dropdownElement.contains(event.target as Node)) closeMenu();
		}

		function handleDocumentKeydown(event: KeyboardEvent) {
			if (menuOpen && event.key === 'Escape') {
				event.preventDefault();
				closeMenu(true);
			}
		}

		document.addEventListener('pointerdown', handlePointerDown);
		document.addEventListener('keydown', handleDocumentKeydown);

		return () => {
			document.removeEventListener('pointerdown', handlePointerDown);
			document.removeEventListener('keydown', handleDocumentKeydown);
		};
	});

	function zoneButtonClass(zoneId: string) {
		return selectedZoneId === zoneId
			? 'border-brand bg-brand text-white shadow-[0_6px_14px_rgba(103,16,43,0.18)]'
			: 'border-brand-border-strong bg-white text-brand-muted';
	}
</script>

<header class="pointer-events-auto relative z-20 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
	<div
		class="rounded-[22px] border border-brand-border-strong bg-white p-2.5 shadow-[0_12px_30px_rgba(72,12,31,0.14)]"
	>
		<div class="flex min-w-0 items-center gap-2.5">
			<MainBrandIcon />

			<div class="relative min-w-0 flex-1" bind:this={dropdownElement}>
				<button
					bind:this={triggerElement}
					type="button"
					class="relative flex h-11 w-full items-center justify-center rounded-[16px] border border-brand-border-strong bg-brand-surface px-10 text-center text-[15px] font-extrabold tracking-[-0.015em] text-brand-text outline-none transition-[border-color,background-color,box-shadow] duration-150 hover:bg-brand-soft/55 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/15"
					aria-label="지도 생활권"
					aria-haspopup="listbox"
					aria-expanded={menuOpen}
					aria-controls="home-area-mode-listbox"
					onclick={toggleMenu}
					onkeydown={handleTriggerKeydown}
				>
					<span class="block w-full truncate text-center">{selectedAreaLabel}</span>
				</button>
				<AppIcon
					name="chevron"
					size={24}
					class={`pointer-events-none absolute right-3 top-[22px] -translate-y-1/2 text-brand transition-transform duration-150 ${menuOpen ? 'rotate-90' : '-rotate-90'}`}
				/>

				{#if menuOpen}
					<div
						id="home-area-mode-listbox"
						class="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-[20px] border border-brand-border-strong bg-white/95 p-1.5 shadow-[0_16px_36px_rgba(72,12,31,0.18)] backdrop-blur-xl"
						role="listbox"
						tabindex="-1"
						aria-label="지도 생활권 선택"
						onkeydown={handleMenuKeydown}
						transition:fly={{ y: -6, duration: 140 }}
					>
						{#each areaModes as mode}
							<button
								type="button"
								class={`flex h-11 w-full items-center justify-center rounded-[14px] px-4 text-center text-[15px] font-extrabold tracking-[-0.015em] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/25 ${
									areaMode === mode.value
										? 'bg-brand-soft text-brand'
										: 'text-brand-text hover:bg-brand-surface'
								}`}
								role="option"
								aria-selected={areaMode === mode.value}
								onclick={() => selectAreaMode(mode.value)}
							>
								{mode.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<a
				class="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-brand-border-strong bg-white text-brand transition-colors hover:bg-brand-soft"
				href="/shops"
				aria-label="상점 페이지"
			>
				<AppIcon name="shop" size={24} />
			</a>
		</div>

		{#if areaMode === 'outside'}
			{#if zones.length > 0}
				<nav
					class="mt-2.5 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
					aria-label="학교 밖 상권 구역"
				>
					<button
						class={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-black transition-colors ${zoneButtonClass('all')}`}
						type="button"
						aria-pressed={selectedZoneId === 'all'}
						onclick={() => onZoneChange('all')}
					>
						전체
					</button>
					{#each zones as zone}
						<button
							class={`shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-black transition-colors ${zoneButtonClass(zone.id)}`}
							type="button"
							aria-pressed={selectedZoneId === zone.id}
							onclick={() => onZoneChange(zone.id)}
						>
							{zone.name}
						</button>
					{/each}
				</nav>
			{:else}
				<p class="m-0 px-2 pb-1 pt-3 text-center text-[13px] font-bold text-brand-muted">
					등록된 상권이 없습니다.
				</p>
			{/if}
		{/if}
	</div>
</header>
