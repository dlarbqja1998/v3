<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, MapPin, X } from '@lucide/svelte';

	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import {
		formatMinutesLeft,
		getCurrentShuttle,
		getNextAvailableShuttle,
		getShuttleSchedulesForDate,
		getShuttleServiceDay,
		getShuttleStopLabel,
		orderShuttleTimeline,
		shuttleStops,
		type ShuttleStopId
	} from '$lib/domain/shuttle';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let activeStopId = $state<ShuttleStopId>('campus');
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
		activeStopId = getInitialShuttleStopId(data);
		const timer = window.setInterval(() => (currentTime = new Date()), 30000);
		return () => window.clearInterval(timer);
	});

	function selectStop(stopId: ShuttleStopId) {
		activeStopId = stopId;
	}

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		goto('/');
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

	function getEstimatedArrivalTime(departureTime: string) {
		const [hours, minutes] = departureTime.split(':').map(Number);
		const totalMinutes = (hours ?? 0) * 60 + (minutes ?? 0) + 10;
		return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
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
		<header class="sticky top-0 z-20 flex min-h-14 items-center justify-center bg-white px-5 pt-[max(8px,env(safe-area-inset-top))]" data-shuttle-header>
			<button
				class="absolute left-5 grid h-11 w-11 place-items-center rounded-full text-brand-text outline-none transition-colors hover:bg-brand-map focus-visible:ring-2 focus-visible:ring-brand/25"
				type="button"
				aria-label="뒤로 가기"
				onclick={goBack}
			>
				<ChevronLeft size={21} strokeWidth={2} />
			</button>
			<h1 class="m-0 text-[16px] font-black tracking-[-0.02em]">셔틀버스</h1>
			<button
				class="absolute right-5 grid h-11 w-11 place-items-center rounded-full text-brand-text outline-none transition-colors hover:bg-brand-map focus-visible:ring-2 focus-visible:ring-brand/25"
				type="button"
				aria-label="셔틀 닫기"
				onclick={() => goto('/')}
			>
				<X size={20} strokeWidth={2} />
			</button>
		</header>

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
						{getEstimatedArrivalTime(nextShuttle.departureTime)} {getStopShortName(nextShuttle.to)} 도착
					</p>
				{/if}
				<a
					class="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-brand transition-colors hover:text-brand-deep"
					href={`/?panel=shuttle&shuttleStop=${activeStopId}`}
				>
					<MapPin size={13} strokeWidth={2.4} /> 지도에서 보기 <ChevronRight size={14} strokeWidth={2.4} />
				</a>
			</section>

			<section class="pt-5" aria-label="셔틀 배차 시간표" data-shuttle-timetable>
				<h2 class="m-0 text-[17px] font-black tracking-[-0.02em]">배차 시간표</h2>

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
										<p class={`m-0 text-[17px] font-black leading-none ${isNext ? 'text-brand' : ''}`}>
											{shuttle.departureTime}
										</p>
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
