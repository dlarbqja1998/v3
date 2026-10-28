<script lang="ts">
	import { untrack } from 'svelte';
	import { ChevronRight, MapPin } from '@lucide/svelte';

	import { analyticsEvents } from '$lib/analytics/events';
	import { track } from '$lib/analytics/posthog.client';
	import LifestylePageHeader from '$lib/navigation/LifestylePageHeader.svelte';
	import {
		formatMinutesLeft,
		getCurrentShuttle,
		getNextAvailableShuttle,
		getShuttleSchedulesForDate,
		getShuttleServiceDay,
		getShuttleStopLabel,
		orderShuttleTimeline,
		shuttleServiceNotices,
		shuttleStops,
		type ShuttleStopId
	} from '$lib/domain/shuttle';
	import type { PageData } from './$types';

	let { data, embedded = false, active = true, onMap }: { data: PageData; embedded?: boolean; active?: boolean; onMap?: (href: string) => void } = $props();
	let activeStopId = $state<ShuttleStopId>(untrack(() => getInitialShuttleStopId(data)));
	let currentTime = $state(new Date());

	const serviceDay = $derived(getShuttleServiceDay(currentTime));
	const todaysSchedules = $derived(getShuttleSchedulesForDate(currentTime, activeStopId));
	const currentShuttle = $derived(getCurrentShuttle(currentTime, activeStopId));
	const nextShuttle = $derived(getNextAvailableShuttle(currentTime, activeStopId));
	const isNextServiceDay = $derived(
		Boolean(nextShuttle && nextShuttle.serviceDate !== getDateKey(currentTime))
	);
	const timetableDate = $derived(
		isNextServiceDay && nextShuttle ? createDateFromKey(nextShuttle.serviceDate) : currentTime
	);
	const timetableSchedules = $derived(getShuttleSchedulesForDate(timetableDate, activeStopId));
	const timelineSchedules = $derived(
		orderShuttleTimeline(timetableSchedules, currentShuttle?.id)
	);
	const isServiceEnded = $derived(
		Boolean(serviceDay && todaysSchedules.length > 0 && !currentShuttle && isNextServiceDay)
	);
	const shuttleOperationStatus = $derived(
		!serviceDay ? '운행 없음' : isServiceEnded ? '운행 종료' : currentShuttle ? '운행 중' : '운행 전'
	);
	const shuttleTabWidth = 100 / shuttleStops.length;

	$effect(() => {
		if (!active) return;
		currentTime = new Date();
		const timer = window.setInterval(() => (currentTime = new Date()), 30000);
		return () => window.clearInterval(timer);
	});

	function selectStop(stopId: ShuttleStopId) {
		track(analyticsEvents.selectShuttleRoute, {
			shuttle_stop_id: stopId,
			source: 'shuttle_page'
		});
		activeStopId = stopId;
	}

	function trackShuttleMapOpen() {
		track(analyticsEvents.clickShuttleMarker, {
			shuttle_stop_id: activeStopId,
			source: 'shuttle_page'
		});
	}

	function getInitialShuttleStopId(pageData: PageData): ShuttleStopId {
		return pageData.initialShuttleStopId === 'jochewon-station-back'
			? 'jochewon-station-back'
			: 'campus';
	}

	function getStopShortName(stopId: 'campus' | 'jochewon-station-back' | 'osong') {
		if (stopId === 'campus') return '고려대';
		if (stopId === 'jochewon-station-back') return '조치원역';
		return '오송역';
	}

	function getDateKey(date: Date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function createDateFromKey(dateKey: string) {
		const [year, month, day] = dateKey.split('-').map(Number);
		return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
	}
</script>

<svelte:head>{#if active && !embedded}
	<title>셔틀 | 골라바유</title>
	<meta name="description" content="고려대학교 세종캠퍼스 셔틀 시간표를 확인하세요." />
{/if}</svelte:head>

<main class:embedded class="min-h-[100dvh] bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="relative min-h-[100dvh] w-full bg-brand-surface pb-[calc(var(--bottom-navigation-height)+20px)] shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] app-page-frame md:border md:border-brand-border"
		aria-label="셔틀"
		data-shuttle-page
	>
		{#if !embedded}<LifestylePageHeader title="셔틀" closeLabel="셔틀 닫기" />{/if}

		<div class="px-5 py-4">
			<div class="relative flex border-b border-brand-border" aria-label="방향 선택" data-shuttle-tabs>
				{#each shuttleStops as stop, index}
					<button
						class={`relative z-10 flex min-h-13 flex-1 items-center justify-center px-1 py-3 text-center text-[15px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/25 ${
							activeStopId === stop.stopId ? 'font-black text-brand' : 'font-bold text-brand-muted'
						}`}
						type="button"
						aria-pressed={activeStopId === stop.stopId}
						onclick={() => selectStop(stop.stopId)}
					>
						{getShuttleStopLabel(stop.stopId)}
					</button>
				{/each}
				<span
					class="pointer-events-none absolute bottom-[-1px] left-0 h-0.5 bg-brand transition-[transform,width] duration-300 ease-out"
					data-shuttle-tab-indicator
					aria-hidden="true"
					style={`width: ${shuttleTabWidth}%; transform: translateX(${activeStopId === 'campus' ? 0 : 100}%);`}
				></span>
			</div>

			<section
				class="mt-4 border-b border-brand-border pb-4 pt-1"
				aria-live="polite"
				data-shuttle-next-card
			>
				<div class="flex items-center justify-between gap-3">
					<p class="m-0 text-[15px] font-black tracking-[-0.02em]">다음 셔틀까지</p>
					<span class={`rounded-full px-2.5 py-1 text-[11px] font-black ${
						shuttleOperationStatus === '운행 중'
							? 'bg-[#e7f4ef] text-[#4f8d7a]'
							: 'bg-brand-map text-brand-muted'
					}`}>
						{shuttleOperationStatus}
					</span>
				</div>
				{#if isServiceEnded || !serviceDay}
					<p class="shuttle-ended-label" data-shuttle-ended-label>{isServiceEnded ? '운행 종료' : '운행 없음'}</p>
				{:else if nextShuttle}
					<p class="m-0 mt-2 text-[28px] font-black leading-none tracking-[-0.04em] text-brand">
						{formatMinutesLeft(nextShuttle.minutesLeft)}
					</p>
				{/if}
				{#if nextShuttle}
					<p class="m-0 mt-2 text-[11px] font-bold text-brand-muted">
						{nextShuttle.departureTime} {getStopShortName(nextShuttle.from)} 출발
						<span class="px-1 text-brand-muted/60">|</span>
						{getStopShortName(nextShuttle.to)} 방향
					</p>
				{/if}
				<a
					class="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-brand transition-colors hover:text-brand-deep"
					href={`/?panel=shuttle&shuttleStop=${activeStopId}`}
					onclick={(event) => { trackShuttleMapOpen(); if (onMap) { event.preventDefault(); onMap(`/?panel=shuttle&shuttleStop=${activeStopId}`); } }}
				>
					<MapPin size={13} strokeWidth={2.4} /> 지도에서 보기 <ChevronRight size={14} strokeWidth={2.4} />
				</a>
			</section>

			<section class="pt-5" aria-label="셔틀 배차 시간표" data-shuttle-timetable>
				<h2 class="shuttle-timetable-title">배차 시간표</h2>

				{#if getShuttleServiceDay(timetableDate) === 'weekday'}
					{@const osongMorning = shuttleServiceNotices.find((notice) => notice.id === 'weekday-osong-0830')}
					{#if osongMorning}
						<div class="mt-3 flex items-center justify-between gap-3 border-y border-brand-border px-1 py-2.5" data-shuttle-service-notice>
							<p class="m-0 text-[13px] font-black text-brand-text">오송역 {osongMorning.time} 출발</p>
							<p class="m-0 text-right text-[11px] font-bold text-brand-muted">6번 출구 · {osongMorning.note}</p>
						</div>
					{/if}
				{/if}

				{#if timelineSchedules.length > 0}
					<ul class="shuttle-timetable-list" data-shuttle-timetable-list>
						{#each timelineSchedules as shuttle}
							{@const isCurrent = currentShuttle?.id === shuttle.id && !isNextServiceDay}
							{@const isNext = nextShuttle?.id === shuttle.id}
							<li class="shuttle-schedule-row" data-shuttle-schedule-row>
								<span
									class="shuttle-schedule-indicator"
									class:next={isNext}
									class:current={isCurrent}
									aria-hidden="true"
								></span>
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between gap-2">
										<div class="flex items-center gap-2">
											<p class="shuttle-departure-time">
												{shuttle.departureTime}
											</p>
											{#if shuttle.vehicleCount && shuttle.vehicleCount > 1}
												<span class="text-[11px] font-bold text-brand-muted" data-shuttle-vehicle-count>{shuttle.vehicleCount}대 운행</span>
											{/if}
										</div>
										<div class="shrink-0">
											{#if isNext}
												<span class="shuttle-schedule-badge" data-shuttle-next-label>다음 차</span>
											{:else if isCurrent}
												<span class="shuttle-schedule-badge current" data-shuttle-current-label>운행차</span>
											{/if}
										</div>
									</div>
									{#if shuttle.note}
										<p class="m-0 mt-1 text-xs font-bold leading-relaxed text-brand-muted/80">{shuttle.note}</p>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="m-0 border-y border-brand-border py-7 text-center text-sm font-bold text-brand-muted">
						토요일은 셔틀을 운행하지 않아요.
					</p>
				{/if}
			</section>

		</div>
	</section>
</main>

<style>
	main.embedded { display: block; min-height: 0; height: 100%; padding: 0; background: white; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
	.embedded > section { min-height: 0; width: 100%; padding-bottom: 24px; border: 0; border-radius: 0; box-shadow: none; }
	.embedded .shuttle-timetable-list { max-height: none; overflow: visible; }
	.shuttle-ended-label { margin: 8px 0 0; padding-block: 2px; color: #8a1538; font-size: 36px; font-weight: 700; line-height: 1.2; letter-spacing: -0.72px; }
	.shuttle-timetable-title { margin: 0; color: #19181a; font-size: 14px; font-weight: 600; line-height: 1.2; letter-spacing: 0; }
	.shuttle-timetable-list { max-height: 42dvh; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
	.shuttle-schedule-row { display: flex; align-items: center; gap: 32px; min-height: 56px; padding: 16px 8px; border-bottom: 1px solid #f0efec; }
	.shuttle-schedule-indicator { flex-shrink: 0; width: 3px; height: 21px; border-radius: 2px; background: transparent; }
	.shuttle-schedule-indicator.next { background: #8a1538; }
	.shuttle-schedule-indicator.current { background: #e2b8c5; }
	.shuttle-departure-time { margin: 0; padding-block: 2px; color: #19181a; font-size: 16px; font-weight: 600; line-height: 1.2; letter-spacing: 0; }
	.shuttle-schedule-badge { display: block; padding: 4px 8px; border-radius: 12px; background: #f7eff2; color: #8a1538; font-size: 11px; font-weight: 700; line-height: 16px; }
	.shuttle-schedule-badge.current { color: #9b989e; background: #f8f8f6; }
</style>
