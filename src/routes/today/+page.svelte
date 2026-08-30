<script lang="ts">
	import { CalendarDays, ChevronRight, MapPin } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import LifestylePageHeader from '$lib/navigation/LifestylePageHeader.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let activeTab = $state<'ongoing' | 'upcoming'>(untrack(() => data.initialTab));
	const activeEvents = $derived(activeTab === 'ongoing' ? data.ongoingEvents : data.upcomingEvents);

	function formatPeriod(startsAt: Date, endsAt: Date) {
		const day = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
		const time = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false });
		const sameDay = day.format(startsAt) === day.format(endsAt);
		return sameDay
			? `${day.format(startsAt)} ${time.format(startsAt)}–${time.format(endsAt)}`
			: `${day.format(startsAt)} ${time.format(startsAt)}–${day.format(endsAt)} ${time.format(endsAt)}`;
	}
</script>

<svelte:head><title>오늘 | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section class="relative min-h-dvh w-full bg-white md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong" aria-label="오늘 행사">
		<LifestylePageHeader title="오늘, 고려대학교" closeLabel="오늘 닫기" />

		<div class="h-[calc(100dvh-56px)] overflow-y-auto px-5 pb-[calc(96px+env(safe-area-inset-bottom))] md:h-[calc(min(860px,100vh-48px)-56px)]">
			<div class="relative grid grid-cols-2 border-b border-brand-border" aria-label="행사 상태" data-today-tabs>
				<button class={`h-12 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${activeTab === 'ongoing' ? 'font-black text-brand' : 'font-bold text-brand-muted'}`} type="button" aria-pressed={activeTab === 'ongoing'} onclick={() => activeTab = 'ongoing'}>진행 중</button>
				<button class={`h-12 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-brand/30 ${activeTab === 'upcoming' ? 'font-black text-brand' : 'font-bold text-brand-muted'}`} type="button" aria-pressed={activeTab === 'upcoming'} onclick={() => activeTab = 'upcoming'}>진행 예정</button>
				<span class="absolute bottom-0 left-0 h-0.5 w-1/2 bg-brand transition-transform duration-300" style={`transform:translateX(${activeTab === 'ongoing' ? 0 : 100}%)`} data-today-tab-indicator></span>
			</div>

			{#if activeEvents.length === 0}
				<section class="grid min-h-64 place-items-center border-b border-brand-border py-10 text-center" aria-live="polite">
					<div><CalendarDays class="mx-auto text-brand" size={28} /><h2 class="m-0 mt-4 text-base font-black">{activeTab === 'ongoing' ? '지금 진행 중인 행사가 없어요' : '예정된 행사가 없어요'}</h2><p class="m-0 mt-2 text-[13px] leading-5 text-brand-muted">새 행사가 등록되면 이곳에서 바로 알려드릴게요.</p></div>
				</section>
			{:else}
				<div class="divide-y divide-brand-border border-b border-brand-border">
					{#each activeEvents as event (event.id)}
						<a class="flex min-h-28 items-center gap-3 py-4" href={`/today/${event.id}`}>
							{#if event.images[0]}
								<img class="h-20 w-20 shrink-0 rounded-xl object-cover" src={event.images[0].url} alt="" />
							{:else}
								<span class="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-brand-map text-brand"><CalendarDays size={26} /></span>
							{/if}
							<span class="min-w-0 flex-1"><span class="block text-[12px] font-black text-brand">{event.category}</span><strong class="mt-1 block truncate text-[15px]">{event.title}</strong><span class="mt-1.5 flex items-center gap-1 truncate text-[12px] text-brand-muted"><CalendarDays size={13} />{formatPeriod(event.startsAt, event.endsAt)}</span><span class="mt-1 flex items-center gap-1 truncate text-[12px] text-brand-muted"><MapPin size={13} />{event.locationName}</span></span>
							<ChevronRight class="shrink-0 text-brand-muted" size={18} />
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<BottomNavigation activeKey="today" containerClass="absolute inset-x-0 bottom-0 z-30" isAuthenticated={Boolean(data.user)} />
	</section>
</main>
