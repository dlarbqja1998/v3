<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { ChevronRight, MapPin } from '@lucide/svelte';

	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
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

	let { data }: { data: PageData } = $props();
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

	onMount(() => {
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

<svelte:head>
	<title>셔틀 | 골라바유</title>
	<meta name="description" content="고려대학교 세종캠퍼스 셔틀 시간표를 확인하세요." />
</svelte:head>

<main class="min-h-[100dvh] bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="relative min-h-[100dvh] w-full bg-brand-surface pb-[calc(var(--bottom-navigation-height)+20px)] shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border"
		aria-label="셔틀"
		data-shuttle-page
	>
		<LifestylePageHeader title="오늘, 셔틀" closeLabel="셔틀 닫기" />

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
				{#if nextShuttle}
					<p class="m-0 mt-2 text-[28px] font-black leading-none tracking-[-0.04em] text-brand">
						{formatMinutesLeft(nextShuttle.minutesLeft)}
					</p>
					<p class="m-0 mt-2 text-[11px] font-bold text-brand-muted">
						{nextShuttle.departureTime} {getStopShortName(nextShuttle.from)} 출발
						<span class="px-1 text-brand-muted/60">|</span>
						{getStopShortName(nextShuttle.to)} 방향
					</p>
				{/if}
				<a
					class="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-brand transition-colors hover:text-brand-deep"
					href={`/?panel=shuttle&shuttleStop=${activeStopId}`}
					onclick={trackShuttleMapOpen}
				>
					<MapPin size={13} strokeWidth={2.4} /> 지도에서 보기 <ChevronRight size={14} strokeWidth={2.4} />
				</a>
			</section>

			<section class="pt-5" aria-label="셔틀 배차 시간표" data-shuttle-timetable>
				<h2 class="m-0 text-[17px] font-black tracking-[-0.02em]">배차 시간표</h2>
				<p class="m-0 mt-1 text-xs font-bold text-brand-muted/80">
					교통 상황에 따라 출발 시간이 달라질 수 있어요.
				</p>

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
					<ul class="m-0 mt-3 max-h-[42dvh] list-none divide-y divide-brand-border overflow-y-auto border-y border-brand-border p-0" data-shuttle-timetable-list>
						{#each timelineSchedules as shuttle}
							{@const isCurrent = currentShuttle?.id === shuttle.id && !isNextServiceDay}
							{@const isNext = nextShuttle?.id === shuttle.id}
							<li class="flex min-h-11 items-center gap-3 py-3 pr-0" data-shuttle-schedule-row>
								<span
									class={`h-[18px] w-1 shrink-0 rounded-full ${
										isNext ? 'bg-brand' : isCurrent ? 'bg-brand/30' : 'bg-transparent'
									}`}
									aria-hidden="true"
								></span>
								<div class="min-w-0 flex-1">
									<div class="flex items-center justify-between gap-2">
										<div class="flex items-center gap-2">
											<p class={`m-0 text-[17px] font-black leading-none ${isNext ? 'text-brand' : ''}`}>
												{shuttle.departureTime}
											</p>
											{#if shuttle.vehicleCount && shuttle.vehicleCount > 1}
												<span class="text-[11px] font-bold text-brand-muted" data-shuttle-vehicle-count>{shuttle.vehicleCount}대 운행</span>
											{/if}
										</div>
										<div class="mr-5 shrink-0">
											{#if isNext}
												<span class="text-xs font-black text-brand" data-shuttle-next-label>다음차</span>
											{:else if isCurrent}
												<span class="text-xs font-black text-brand/65" data-shuttle-current-label>운행차</span>
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

		<BottomNavigation
			activeKey="shuttle"
			containerClass="fixed inset-x-0 bottom-0 z-40 md:left-1/2 md:w-[min(100%,430px)] md:-translate-x-1/2"
			isAuthenticated={Boolean(data.user)}
		/>
	</section>
</main>
