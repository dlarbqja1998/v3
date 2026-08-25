<script lang="ts">
	import { onMount } from 'svelte';
	import { MapPin } from '@lucide/svelte';

	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import {
		formatMinutesLeft,
		getShuttleSchedulesForDate,
		getShuttleServiceDay,
		getShuttleStopLabel,
		getStopName,
		getUpcomingShuttles,
		shuttleScheduleSource,
		shuttleServiceNotices,
		shuttleStops,
		type ShuttleStopId
	} from '$lib/domain/shuttle';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let activeStopId = $state<ShuttleStopId>('campus');
	let currentTime = $state(new Date());

	const activeStop = $derived(shuttleStops.find((stop) => stop.stopId === activeStopId) ?? shuttleStops[0]);
	const serviceDay = $derived(getShuttleServiceDay(currentTime));
	const todaysSchedules = $derived(getShuttleSchedulesForDate(currentTime, activeStopId));
	const nextShuttle = $derived(getUpcomingShuttles(currentTime, activeStopId, 1)[0] ?? null);
	const serviceNotices = $derived(
		serviceDay ? shuttleServiceNotices.filter((notice) => notice.dayType === serviceDay) : []
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

	function getInitialShuttleStopId(pageData: PageData): ShuttleStopId {
		return pageData.initialShuttleStopId === 'jochewon-station-back'
			? 'jochewon-station-back'
			: 'campus';
	}

	function getServiceDayLabel() {
		if (serviceDay === 'weekday') return '평일 시간표';
		if (serviceDay === 'sunday') return '일요일 시간표';
		return '토요일은 운행하지 않아요';
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
		<header class="sticky top-0 z-20 border-b border-brand-border bg-white px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))]" data-shuttle-header>
			<h1 class="m-0 text-center text-lg font-black">오늘의 셔틀</h1>
		</header>

		<div class="px-5 py-5">
			<div class="relative flex border-b border-brand-border" aria-label="출발지 선택" data-shuttle-tabs>
				{#each shuttleStops as stop, index}
					<button
						class={`relative z-10 flex min-h-13 flex-1 items-center justify-center px-1 py-3 text-center text-[15px] transition-colors duration-200 ${
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
					aria-hidden="true"
					style={`width: ${shuttleTabWidth}%; transform: translateX(${activeStopId === 'campus' ? 0 : 100}%);`}
				></span>
			</div>

			{#if serviceNotices.length > 0}
				<section class="border-b border-brand-border py-4" aria-label="오송역 운행" data-shuttle-osong-services>
					<h2 class="m-0 text-sm font-black">오송역 운행</h2>
					<ul class="m-0 mt-2 list-none divide-y divide-brand-border p-0">
						{#each serviceNotices as notice}
							<li class="flex min-h-11 items-center gap-3 py-2">
								<span class="shrink-0 text-sm font-black text-brand">{notice.time}</span>
								<p class="m-0 text-[13px] font-bold text-brand-muted">
									{notice.label} · {notice.note}
								</p>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<section class="border-b border-brand-border py-5" aria-live="polite" data-shuttle-next-departure>
				<div class="flex items-end justify-between gap-4">
					<div>
						<p class="m-0 text-[13px] font-bold text-brand-muted">{getServiceDayLabel()}</p>
						{#if nextShuttle}
							<p class="m-0 mt-1.5 text-[30px] font-black leading-none text-brand">{nextShuttle.departureTime}</p>
							<p class="m-0 mt-2 text-sm font-bold">{getStopName(nextShuttle.to)} 방향</p>
						{:else if serviceDay}
							<p class="m-0 mt-1.5 text-xl font-black">오늘 운행이 종료됐어요</p>
						{:else}
							<p class="m-0 mt-1.5 text-xl font-black">다음 운행일에 확인해 주세요</p>
						{/if}
					</div>
					{#if nextShuttle}
						<span class="shrink-0 text-sm font-black text-brand">{formatMinutesLeft(nextShuttle.minutesLeft)}</span>
					{/if}
				</div>
			</section>

			<div class="flex min-h-11 items-center justify-center border-b border-brand-border py-1" data-shuttle-actions>
				<a
					class="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-bold text-brand-muted/70 transition-colors hover:text-brand"
					href={`/?panel=shuttle&shuttleStop=${activeStopId}`}
				>
					<MapPin size={13} strokeWidth={2.8} /> 지도에서 보기
				</a>
			</div>

			<section class="pt-5" aria-label={`${getShuttleStopLabel(activeStopId)} 시간표`}>
				<div class="flex items-baseline justify-between gap-3">
					<h2 class="m-0 text-base font-black">출발 시간</h2>
					<span class="text-xs font-bold text-brand-muted">{activeStop?.name}</span>
				</div>

				{#if todaysSchedules.length > 0}
					<ul class="m-0 mt-3 list-none divide-y divide-brand-border border-y border-brand-border p-0">
						{#each todaysSchedules as shuttle}
							<li class="flex min-h-14 items-center justify-between gap-4 py-3">
								<div>
									<p class={`m-0 text-base font-black ${nextShuttle?.id === shuttle.id ? 'text-brand' : ''}`}>
										{shuttle.departureTime}
									</p>
									<p class="m-0 mt-1 text-[13px] font-bold text-brand-muted">
										{getStopName(shuttle.to)} 방향{shuttle.note ? ` · ${shuttle.note}` : ''}
									</p>
								</div>
								{#if nextShuttle?.id === shuttle.id}
									<span class="shrink-0 text-xs font-black text-brand">곧 출발</span>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="m-0 border-y border-brand-border py-7 text-center text-sm font-bold text-brand-muted">
						토요일은 셔틀을 운행하지 않아요.
					</p>
				{/if}
			</section>

			<p class="m-0 pt-4 text-center text-[11px] font-bold text-brand-muted/70">
				{shuttleScheduleSource.name} 기준 · {shuttleScheduleSource.verifiedAt.replaceAll('-', '.')}
			</p>
		</div>

		<BottomNavigation
			activeKey="shuttle"
			containerClass="fixed inset-x-0 bottom-0 z-40 md:left-1/2 md:w-[min(100%,430px)] md:-translate-x-1/2"
			isAuthenticated={Boolean(data.user)}
		/>
	</section>
</main>
