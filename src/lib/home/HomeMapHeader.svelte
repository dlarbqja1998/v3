<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import MainBrandIcon from '$lib/brand/MainBrandIcon.svelte';
	import {
		buildMapAreaOptions,
		type CommercialZone
	} from '$lib/domain/commercial-zones';
	import AppIcon from '$lib/icon/AppIcon.svelte';

	let {
		zones,
		selectedAreaId,
		onAreaChange
	}: {
		zones: CommercialZone[];
		selectedAreaId: string;
		onAreaChange: (areaId: string) => void;
	} = $props();

	let menuOpen = $state(false);
	let dropdownElement: HTMLDivElement;
	let triggerElement: HTMLButtonElement;
	let areaOptions = $derived(buildMapAreaOptions(zones));
	let selectedAreaLabel = $derived(
		areaOptions.find((option) => option.id === selectedAreaId)?.name ?? areaOptions[0]?.name ?? ''
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
</script>

<header class="pointer-events-auto relative z-30 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
	<div class="rounded-[22px] border border-brand-border-strong bg-white p-2.5 shadow-[0_12px_30px_rgba(72,12,31,0.14)]">
		<div class="flex min-w-0 items-center gap-2.5">
			<MainBrandIcon />

			<div class="relative min-w-0 flex-1" bind:this={dropdownElement}>
				<button
					bind:this={triggerElement}
					type="button"
					class="relative flex h-11 w-full items-center justify-center rounded-[16px] border border-brand-border-strong bg-brand-surface px-10 text-center text-[15px] font-extrabold tracking-[-0.015em] text-brand-text outline-none transition-[border-color,background-color,box-shadow] duration-150 hover:bg-brand-soft/55 focus-visible:border-brand focus-visible:ring-4 focus-visible:ring-brand/15"
					aria-label="지도 구역"
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
					size={24}
					class={`pointer-events-none absolute right-3 top-[22px] -translate-y-1/2 text-brand transition-transform duration-150 ${menuOpen ? 'rotate-90' : '-rotate-90'}`}
				/>

				{#if menuOpen}
					<div
						id="home-map-area-listbox"
						class="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[min(360px,58dvh)] overflow-y-auto rounded-[20px] border border-brand-border-strong bg-white/95 p-1.5 shadow-[0_16px_36px_rgba(72,12,31,0.18)] backdrop-blur-xl"
						role="listbox"
						tabindex="-1"
						aria-label="지도 구역 선택"
						onkeydown={handleMenuKeydown}
						transition:fly={{ y: -6, duration: 140 }}
					>
						{#each areaOptions as option}
							<button
								type="button"
								class={`flex min-h-11 w-full items-center justify-center rounded-[14px] px-4 py-2 text-center text-[15px] font-extrabold tracking-[-0.015em] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/25 ${
									selectedAreaId === option.id
										? 'bg-brand-soft text-brand'
										: 'text-brand-text hover:bg-brand-surface'
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

			<a
				class="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-brand-border-strong bg-white text-brand transition-colors hover:bg-brand-soft"
				href="/shops"
				aria-label="상점 페이지"
			>
				<AppIcon name="shop" size={24} />
			</a>
		</div>
	</div>
</header>
