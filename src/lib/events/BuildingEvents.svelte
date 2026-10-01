<script lang="ts">
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { getCampusEventStatus } from '$lib/domain/campus-events';
	import type { CampusEventDto } from '$lib/server/campus-events';
	import { analyticsEvents } from '$lib/analytics/events';
	import { track } from '$lib/analytics/posthog.client';

	let { events, now, placeName }: { events: CampusEventDto[]; now: Date; placeName: string } = $props();
	const date = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
	const time = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
	function period(event: CampusEventDto) {
		return `${date.format(event.startsAt)} ${time.format(event.startsAt)}–${date.format(event.startsAt) === date.format(event.endsAt) ? '' : date.format(event.endsAt) + ' '}${time.format(event.endsAt)}`;
	}
</script>

<section class="gb1-section" style="--gb1-section-inset:18px" aria-label={`${placeName} 행사`} data-building-events>
	<div class="mb-2 flex items-baseline gap-2"><h3 class="gb1-section-title m-0">행사</h3><span class="text-[13px] font-bold tabular-nums text-brand">{events.length}</span></div>
	<p class="m-0 mb-3 text-[12px] text-brand-muted">진행 중 · 7일 이내 예정</p>
	{#each events as event (event.id)}
		{@const ongoing = getCampusEventStatus(event, now) === 'ongoing'}
		<a href={`/today/${event.id}`} class="flex min-h-14 items-center gap-3 border-b border-brand-border py-4"
			onclick={() => track(analyticsEvents.selectEvent, { event_id: event.id, source: 'building_panel', building_name: placeName })}>
			<span class="min-w-0 flex-1">
				<span class={`text-[11px] font-bold ${ongoing ? 'text-brand' : 'text-brand-muted'}`}>{ongoing ? '진행 중' : '진행 예정'} · {event.category}</span>
				<strong class="mt-1 block break-keep text-[15px] font-bold leading-6">{event.title}</strong>
				<span class="mt-1 block text-[13px] text-brand-muted">{period(event)}</span>
				<span class="mt-0.5 block text-[13px] text-brand-muted">{event.locationName}</span>
			</span>
			<AppIcon name="chevron" size={20} class="shrink-0 rotate-180 text-brand-muted" />
		</a>
	{:else}
		<p class="m-0 py-4 text-[13px] leading-6 text-brand-muted">지금 이곳에 등록된 행사가 없어요.</p>
	{/each}
</section>
