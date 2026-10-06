<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import { pushState } from '$app/navigation';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { startVisibleClock } from '$lib/browser/visible-clock';
	import { analyticsEvents } from '$lib/analytics/events';
	import { track } from '$lib/analytics/posthog.client';
	import { formatFestivalPrice, getFestivalBooths, getFestivalBoothForSession, getInitialFestivalSelection, getNextFestivalPerformance, getFestivalPerformanceStatus, type Festival, type FestivalSession } from '$lib/domain/festival';
	let { festival, onClose, onExpand, collapsed = false }: { festival: Festival; onClose: () => void; onExpand: () => void; collapsed?: boolean } = $props();
	const initialSelection = untrack(() => getInitialFestivalSelection(festival));
	let session = $state<FestivalSession>(initialSelection.session);
	let date = $state(initialSelection.date);
	let now = $state(new Date());
	onMount(() => startVisibleClock((value) => { now = value; }, 30_000));
	const boothId = $derived(page.state.festivalBooth ?? '');
	let scrollHost = $state<HTMLDivElement>();
	let listScroll = 0;
	let previousBooth = '';
	const selectedDate = $derived(festival.dates.find((item) => item.date === date) ?? festival.dates[0]);
	const booths = $derived(getFestivalBooths(festival, selectedDate?.date, session));
	const booth = $derived(getFestivalBoothForSession(festival, boothId, session, selectedDate?.date));
	const content = $derived(booth?.sessions[session]);
	const itemSections = $derived([...new Set(content?.items.map((item) => item.section ?? (session === 'day' ? '여기서 할 수 있어요' : '메뉴와 가격')) ?? [])]);
	const performances = $derived(festival.performances.filter((item) => item.date === selectedDate?.date && item.session === session).sort((a,b) => a.time.localeCompare(b.time)));
	const nextPerformance = $derived(getNextFestivalPerformance(performances, now));
	const nightPerformances = $derived(festival.performances.filter((item) => item.date === selectedDate?.date && item.session === 'night'));
	const benefits = $derived(festival.benefits?.filter((item) => item.date === selectedDate?.date && item.sessions.includes(session)) ?? []);
	const performanceLabel = $derived(festival.performanceLabel ?? '공연');
	const checkedLabel = $derived(festival.checkedAt ? new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Seoul' }).format(new Date(festival.checkedAt)) : '');
	function selectSession(value: FestivalSession) {
		track(analyticsEvents.selectFestivalSession, { festival_id: festival.id, session: value, date });
		session = value;
		if (scrollHost) scrollHost.scrollTop = 0;
	}

	async function openBooth(id: string) {
		track(analyticsEvents.selectFestivalBooth, { festival_id: festival.id, booth_id: id, session, date });
		listScroll = scrollHost?.scrollTop ?? 0;
		pushState('', { ...page.state, festivalBooth: id });
		onExpand();
		await tick();
		if (scrollHost) scrollHost.scrollTop = 0;
	}
	async function backToList() {
		window.history.back();
	}
	$effect(() => {
		const current = boothId;
		if (previousBooth && !current) void tick().then(() => { if (scrollHost) scrollHost.scrollTop = listScroll; });
		previousBooth = current;
	});
	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		if (boothId) void backToList(); else onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex min-h-0 flex-1 flex-col" data-festival-panel>
	<header class="relative flex min-h-12 shrink-0 items-center justify-center border-b border-brand-border py-2">
		{#if booth}<button type="button" class="absolute left-0 flex min-h-11 items-center gap-1 text-[13px] text-brand-muted" onclick={backToList} aria-label="부스 목록으로 돌아가기"><AppIcon name="chevron" size={20} />목록</button>{/if}
		<h2 class="m-0 max-w-[calc(100%-112px)] break-keep text-center text-[18px] leading-6 font-bold">{booth?.name ?? festival.name}</h2>
		<button type="button" class="absolute right-0 min-h-11 text-[13px] text-brand-muted" onclick={onClose}>닫기</button>
	</header>
	{#if !collapsed}
		<div class="flex shrink-0 items-center justify-between gap-3 pt-4 pb-2">
			{#if festival.dates.length > 1}
				<select aria-label="축제 날짜" class="bg-transparent text-[16px] font-bold" bind:value={date}
					onchange={(event) => track(analyticsEvents.selectFestivalDate, { festival_id: festival.id, date: event.currentTarget.value, session })}>{#each festival.dates as item}<option value={item.date}>{item.label}</option>{/each}</select>
			{:else}<p class="m-0 text-[16px] font-bold">{selectedDate?.label}</p>{/if}
			<span class="text-right text-[12px] text-brand-muted">{booth ? booth.number ? `${booth.number}번 부스` : '부스 안내' : festival.area.label}</span>
		</div>
		<div class="relative grid shrink-0 grid-cols-2 border-b border-brand-border" aria-label="낮과 밤 선택">
			{#each [{ id: 'day', label: festival.sessionLabels?.day ?? '낮 · 활동' }, { id: 'night', label: festival.sessionLabels?.night ?? '밤 · 부스' }] as tab}
				<button type="button" aria-label={tab.label} title={tab.label} aria-pressed={session === tab.id} disabled={Boolean(boothId) && !getFestivalBoothForSession(festival, boothId, tab.id as FestivalSession, selectedDate?.date)} class={`flex h-12 items-center justify-center gap-2 text-[13px] transition-colors duration-200 motion-reduce:transition-none disabled:opacity-30 ${session === tab.id ? 'font-bold text-brand' : 'text-brand-muted'}`} onclick={() => selectSession(tab.id as FestivalSession)}><AppIcon name={tab.id === 'day' ? 'sun' : 'moon'} size={20} />{tab.label}</button>
			{/each}
			<span aria-hidden="true" class="absolute bottom-[-1px] left-0 h-0.5 w-1/2 bg-brand transition-transform duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" style:transform={session === 'night' ? 'translateX(100%)' : 'translateX(0)'}></span>
		</div>
		<div bind:this={scrollHost} class="-mx-[18px] min-h-0 flex-1 overflow-y-auto overscroll-contain px-[18px] pb-5 [--gb1-section-inset:18px]" data-festival-scroll>
			{#if booth}
				<div class="border-b border-brand-border py-4">
					{#if booth.clubName}<p class="m-0 mb-4 text-[13px] text-brand-muted">{booth.clubName}</p>{/if}
					<p class="m-0 text-[15px] font-bold">{content?.hours ?? '운영시간 안내 준비 중'}</p>
					<p class="m-0 mt-2 break-keep text-[13px] leading-6 text-brand-muted">위치 · {booth.location || festival.area.label}</p>
					{#if booth.locationSourceUrl}<a class="inline-flex min-h-11 items-center text-[12px] text-brand-muted underline underline-offset-4" href={booth.locationSourceUrl}>위치 안내 · 공식 배치도</a>{/if}
					{#if content?.notice}<p class="m-0 mt-3 text-[13px] leading-6 text-brand-muted">{content.notice}</p>{/if}
				</div>
				{#if content?.items.length}
					{#each itemSections as section}
						<section class="gb1-section" aria-label={section}>
							<h3 class="gb1-section-title m-0 pb-2">{section}</h3>
							{#each content.items.filter((item) => (item.section ?? (session === 'day' ? '여기서 할 수 있어요' : '메뉴와 가격')) === section) as item}<div class="border-b border-brand-border py-4"><div class="flex items-start justify-between gap-3"><span class="min-w-0 text-[13px] font-bold">{item.name}</span><span class={`max-w-[48%] shrink-0 text-right text-[13px] font-bold ${item.price === 0 || item.price === null ? 'text-brand-muted' : 'text-brand'}`}>{item.priceLabel ?? formatFestivalPrice(item.price)}</span></div>{#if item.description}<p class="m-0 mt-2 text-[13px] leading-6 text-brand-muted">{item.description}</p>{/if}</div>{/each}
						</section>
					{/each}
				{:else}<div class="py-5"><p class="m-0 text-[13px]">{session === 'night' ? content ? '메뉴와 가격을 준비하고 있어요.' : '밤 운영 여부와 메뉴를 기다리고 있어요.' : '활동 안내를 기다리고 있어요.'}</p><p class="m-0 mt-2 text-[12px] leading-5 text-brand-muted">안내가 확인되면 이곳에 추가할게요.</p></div>{/if}
				{#if booth.sourceUrl}<a class="inline-flex min-h-11 items-center text-[13px] text-brand-muted underline underline-offset-4" href={booth.sourceUrl}>부스 원문 보기 · 에타</a>{/if}
			{:else}
				<p class="m-0 border-b border-brand-border py-3 text-[12px] leading-5 text-brand-muted">{festival.hoursLabel ?? selectedDate?.hours[session] ?? `${session === 'day' ? '낮' : '밤'} 전체 운영시간 안내 준비 중`}</p>
				{#if session === 'night' || performances.length > 0}
					<section class="gb1-section" aria-label={`${performanceLabel} 시간표`}>
						<h3 class="gb1-section-title m-0">{performanceLabel} 시간표</h3>
						<p class="m-0 mt-2 text-[12px] leading-5 text-brand-muted">공지된 시간 기준이에요. 현장 진행에 따라 달라질 수 있어요.</p>
						{#if performances.length}
							{#each performances as performance}
								{@const status = getFestivalPerformanceStatus(performance, now)}
								<div class="grid min-h-14 grid-cols-[7.5em_minmax(0,1fr)] items-start gap-x-4 border-b border-brand-border py-3 text-[13px] leading-5">
									<strong class="whitespace-nowrap tabular-nums text-brand">{performance.time}{#if nextPerformance?.id === performance.id}<span class="mt-1 block text-[11px] font-normal">다음 일정</span>{:else if status !== 'upcoming'}<span class="mt-1 block text-[11px] font-normal text-brand-muted">{status === 'ongoing' ? '일정상 진행 중' : status === 'ended' ? '일정상 종료' : '시작 시각 지남'}</span>{/if}</strong>
									<div class="min-w-0 break-keep"><span class="font-bold">{performance.name}</span>{#if performance.kind}<small class="ml-2 text-brand-muted">{performance.kind}</small>{/if}{#if performance.location}<p class="m-0 mt-1 text-[12px] text-brand-muted">{performance.location}</p>{/if}{#if performance.notice}<p class="m-0 mt-1 text-[12px] text-brand-muted">{performance.notice}</p>{/if}{#if performance.sourceUrl}<a class="inline-flex min-h-11 items-center text-[12px] text-brand-muted underline underline-offset-4" href={performance.sourceUrl}>{performance.name} 일정 공지</a>{/if}</div>
								</div>
							{/each}
						{:else}
							<p class="m-0 mt-3 text-[13px] text-brand-muted">동아리·아티스트 공연 안내 준비 중</p>
						{/if}
					</section>
				{/if}
				<section class="gb1-section" aria-label="부스 목록">
				<div class="flex items-center justify-between pb-2"><h3 class="gb1-section-title m-0">{session === 'day' ? '낮에 만나는 부스' : '밤에 만나는 부스'}</h3><span class="text-[12px] text-brand-muted">{booths.length}곳</span></div>
				{#each booths as item}
					<button type="button" class="flex w-full items-center gap-3 border-b border-brand-border py-4 text-left" onclick={() => openBooth(item.id)}>
						{#if item.number}<span class="w-7 shrink-0 text-[13px] font-bold tabular-nums text-brand-muted">{item.number}</span>{/if}
						<span class="min-w-0 flex-1">
							<strong class="block break-keep text-[15px] font-bold">{item.name}</strong>
							{#if session === 'night' || item.subtitle}<span class="mt-1 block text-[13px] text-brand-muted">{session === 'day' ? item.subtitle : item.clubName || item.subtitle || '운영 단체 확인 중'}</span>{/if}
							{#if item.location}<span class="mt-2 block break-keep text-[12px] leading-5 text-brand-muted">위치 · {item.location}</span>{/if}
							{#if item.sessions[session]?.hours && item.sessions[session]?.hours !== selectedDate?.hours[session]}<span class="mt-2 block text-[12px] text-brand-muted">{item.sessions[session]?.hours}</span>{/if}
						</span>
						<AppIcon name="chevron" size={20} class="rotate-180 text-brand-muted" />
					</button>
				{/each}
				{#if booths.length === 0}<p class="m-0 py-4 text-[13px] text-brand-muted">이 시간대의 부스 안내를 확인하고 있어요.</p>{/if}
				</section>
				{#if session === 'day' && nightPerformances.length}
					<button type="button" class="flex min-h-14 w-full items-center justify-between gap-3 border-y border-brand-border py-3 text-left" onclick={() => selectSession('night')}><span><strong class="block text-[13px]">오늘 밤 {performanceLabel} {nightPerformances.length}개</strong><span class="mt-1 block text-[12px] leading-5 text-brand-muted">{nightPerformances.map((item) => `${item.name} ${item.time}`).join(' · ')}</span></span><AppIcon name="chevron" size={20} class="shrink-0 rotate-180 text-brand-muted" /></button>
				{/if}
				{#if benefits.length}
					<section class="gb1-section" aria-label="참여 혜택"><h3 class="gb1-section-title m-0">참여 혜택</h3>
						{#each benefits as benefit}<div class="border-b border-brand-border py-4"><div class="flex items-start justify-between gap-3"><strong class="text-[13px]">{benefit.title}</strong>{#if benefit.timeLabel}<span class="shrink-0 text-[12px] font-bold text-brand">{benefit.timeLabel}</span>{/if}</div><p class="m-0 mt-2 text-[13px] leading-6">{benefit.description}</p>{#if benefit.notice}<p class="m-0 mt-2 text-[12px] leading-5 text-brand-muted">{benefit.notice}</p>{/if}{#if benefit.sourceUrl}<a class="inline-flex min-h-11 items-center text-[12px] text-brand-muted underline underline-offset-4" href={benefit.sourceUrl}>{benefit.title} 공지</a>{/if}</div>{/each}
					</section>
				{/if}
				<p class="m-0 pt-5 text-[12px] leading-5 text-brand-muted">{festival.notice ?? (session === 'night' ? '메뉴와 가격은 확인되는 대로 추가할게요.' : '부스 안내는 확인되는 대로 추가할게요.')}</p>
				{#if festival.posterUrl}<section class="gb1-section" aria-label="행사 포스터"><h3 class="gb1-section-title m-0 mb-4">행사 포스터</h3><img src={festival.posterUrl} alt={`${festival.name} 공식 포스터`} loading="lazy" class="h-auto w-full" /></section>{/if}
				{#if festival.sourceUrl}<a class="inline-flex min-h-11 items-center text-[13px] text-brand-muted underline underline-offset-4" href={festival.sourceUrl}>축제 공식 공지 · 에타</a>{/if}
			{/if}
			{#if checkedLabel}<p class="m-0 mt-2 text-[11px] text-brand-muted">자료 확인 · {checkedLabel}</p>{/if}
		</div>
	{/if}
</div>
