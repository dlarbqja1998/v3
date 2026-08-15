<script lang="ts">
	import MainBrandIcon from '$lib/brand/MainBrandIcon.svelte';
	import type { CommercialZone, MapAreaMode } from '$lib/domain/commercial-zones';
	import AppIcon from '$lib/icon/AppIcon.svelte';

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

	function handleAreaModeChange(event: Event) {
		onAreaModeChange((event.currentTarget as HTMLSelectElement).value as MapAreaMode);
	}

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

			<label class="relative min-w-0 flex-1">
				<span class="sr-only">지도 생활권</span>
				<select
					class="h-11 w-full appearance-none rounded-[14px] border border-brand-border-strong bg-brand-surface px-4 pr-10 text-base font-black text-brand-text outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
					aria-label="지도 생활권"
					value={areaMode}
					onchange={handleAreaModeChange}
				>
					<option value="campus">학교안</option>
					<option value="outside">학교밖</option>
				</select>
				<AppIcon
					name="chevron"
					size={24}
					class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-brand"
				/>
			</label>

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
