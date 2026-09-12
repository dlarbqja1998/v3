<script lang="ts">
	import { onMount } from 'svelte';
	import { startVisibleClock } from '$lib/browser/visible-clock';
	import { getShuttleCountdown } from '$lib/domain/shuttle-countdown';
	import type { ShuttleStopId } from '$lib/domain/shuttle';

	let { stopId }: { stopId: ShuttleStopId } = $props();
	let now = $state(new Date());
	const countdown = $derived(getShuttleCountdown(now, stopId));
	onMount(() => startVisibleClock((value) => { now = value; }));
</script>

<div class="mb-4 border-y border-brand-border py-3" data-shuttle-stop-countdown>
	<div class="flex min-h-16 items-center justify-between gap-4">
		<div>
			<p class="m-0 text-[12px] text-brand-muted">다음 셔틀까지</p>
			<strong class="mt-1 block text-[20px] font-bold tabular-nums text-brand">{countdown.label}</strong>
		</div>
		<div class="shrink-0 text-right">
			{#if countdown.departureTime}<p class="m-0 text-[14px] font-bold tabular-nums">{countdown.departureTime} 출발</p>{/if}
			<p class="m-0 mt-1 text-[12px] text-brand-muted">{countdown.directionLabel} · 시간표 기준</p>
		</div>
	</div>
	<p class="m-0 mt-2 text-[12px] text-brand-muted">임시 운휴·지연은 반영되지 않을 수 있어요.</p>
</div>
