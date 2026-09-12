<script lang="ts">
	import { tick } from 'svelte';
	import { page } from '$app/state';
	import { pushState } from '$app/navigation';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { formatFestivalPrice, getFestivalBooths, type Festival, type FestivalSession } from '$lib/domain/festival';
	let { festival, onClose, onExpand, collapsed = false }: { festival: Festival; onClose: () => void; onExpand: () => void; collapsed?: boolean } = $props();
	let session = $state<FestivalSession>('day');
	let date = $state('');
	const boothId = $derived(page.state.festivalBooth ?? '');
	let scrollHost = $state<HTMLDivElement>();
	let listScroll = 0;
	let previousBooth = '';
	const selectedDate = $derived(festival.dates.find((item) => item.date === date) ?? festival.dates[0]);
	const booths = $derived(getFestivalBooths(festival, selectedDate?.date, session));
	const booth = $derived(festival.booths.find((item) => item.id === boothId && item.date === selectedDate?.date));
	const content = $derived(booth?.sessions[session]);
	const performances = $derived(festival.performances.filter((item) => item.date === selectedDate?.date && item.session === session).sort((a,b) => a.time.localeCompare(b.time)));

	async function openBooth(id: string) {
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
				<select aria-label="축제 날짜" class="bg-transparent text-[16px] font-bold" bind:value={date}>{#each festival.dates as item}<option value={item.date}>{item.label}</option>{/each}</select>
			{:else}<p class="m-0 text-[16px] font-bold">{selectedDate?.label}</p>{/if}
			<span class="text-[12px] text-brand-muted">{booth ? `${booth.number}번 부스` : festival.area.label}</span>
		</div>
		<div class="relative grid shrink-0 grid-cols-2 border-b border-brand-border" aria-label="낮과 밤 선택">
			{#each [{ id: 'day', label: '낮 · 활동' }, { id: 'night', label: '밤 · 주점' }] as tab}
				<button type="button" aria-label={tab.label} title={tab.label} aria-pressed={session === tab.id} class={`flex h-12 items-center justify-center transition-colors duration-200 motion-reduce:transition-none ${session === tab.id ? 'text-brand' : 'text-brand-muted'}`} onclick={() => { session = tab.id as FestivalSession; if (scrollHost) scrollHost.scrollTop = 0; }}><AppIcon name={tab.id === 'day' ? 'sun' : 'moon'} size={24} /></button>
			{/each}
			<span aria-hidden="true" class="absolute bottom-[-1px] left-0 h-0.5 w-1/2 bg-brand transition-transform duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" style:transform={session === 'night' ? 'translateX(100%)' : 'translateX(0)'}></span>
		</div>
		<div bind:this={scrollHost} class="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5" data-festival-scroll>
			{#if booth}
				<div class="border-b border-brand-border py-4">
					{#if booth.sessions.night}<h3 class="m-0 mb-1 break-keep text-[15px] font-bold">{booth.name}</h3><p class="m-0 mb-4 text-[13px] text-brand-muted">{booth.clubName || '동아리명 확인 중'}</p>{/if}
					<p class="m-0 text-[15px] font-bold">{content?.hours ?? '운영시간 안내 준비 중'}</p>
					<p class="m-0 mt-1.5 text-[13px] text-brand-muted">{booth.location || '위치 안내 준비 중'} · {session === 'day' ? '낮부스' : '밤부스'}</p>
				</div>
				<h3 class="m-0 pt-5 pb-2 text-[15px] font-bold">{session === 'day' ? '여기서 할 수 있어요' : '메뉴와 가격'}</h3>
				{#if content?.items.length}
					{#each content.items as item}<div class="border-b border-brand-border py-4"><div class="flex items-start justify-between gap-3"><span class="text-[13px] font-bold">{item.name}</span><span class={`shrink-0 text-[13px] font-bold ${item.price === 0 ? 'text-brand-muted' : 'text-brand'}`}>{formatFestivalPrice(item.price)}</span></div>{#if item.description}<p class="m-0 mt-2 text-[13px] leading-6 text-brand-muted">{item.description}</p>{/if}</div>{/each}
				{:else}<div class="py-5"><p class="m-0 text-[13px]">{session === 'night' ? content ? '메뉴와 가격을 준비하고 있어요.' : '밤 운영 여부와 메뉴를 기다리고 있어요.' : '활동 안내를 기다리고 있어요.'}</p><p class="m-0 mt-2 text-[12px] leading-5 text-brand-muted">안내가 확인되면 이곳에 추가할게요.</p></div>{/if}
			{:else}
				<p class="m-0 border-b border-brand-border py-3 text-[12px] text-brand-muted">{selectedDate?.hours[session] ?? `${session === 'day' ? '낮' : '밤'} 전체 운영시간 안내 준비 중`}</p>
				{#if session === 'night' || performances.length > 0}
					<section class="border-b border-brand-border py-5" aria-label="공연 시간표">
						<h3 class="m-0 text-[15px] font-bold">공연 시간표</h3>
						{#if performances.length}
							{#each performances as performance}
								<div class="grid min-h-14 grid-cols-[7.5em_minmax(0,1fr)] items-center gap-x-4 border-b border-brand-border py-3 text-[13px] leading-5">
									<strong class="whitespace-nowrap tabular-nums text-brand">{performance.time}</strong>
									<span class="min-w-0 break-keep">{performance.name}{#if performance.kind}<small class="ml-2 text-brand-muted">{performance.kind}</small>{/if}</span>
								</div>
							{/each}
						{:else}
							<p class="m-0 mt-3 text-[13px] text-brand-muted">동아리·아티스트 공연 안내 준비 중</p>
						{/if}
					</section>
				{/if}
				<div class="flex items-center justify-between pt-5 pb-2"><h3 class="m-0 text-[15px] font-bold">{session === 'day' ? '낮에 만나는 부스' : '밤에 만나는 부스'}</h3><span class="text-[12px] text-brand-muted">{booths.length}개 등록</span></div>
				{#each booths as item}
					<button type="button" class="flex w-full items-center gap-3 border-b border-brand-border py-4 text-left" onclick={() => openBooth(item.id)}>
						<span class="w-7 shrink-0 text-[13px] font-bold tabular-nums text-brand-muted">{item.number}</span>
						<span class="min-w-0 flex-1">
							<strong class="block break-keep text-[15px] font-bold">{item.name}</strong>
							{#if session === 'night' || item.subtitle}<span class="mt-1 block text-[13px] text-brand-muted">{session === 'day' ? item.subtitle : item.clubName || '동아리명 확인 중'}</span>{/if}
							{#if item.sessions[session]?.hours && item.sessions[session]?.hours !== selectedDate?.hours[session]}<span class="mt-2 block text-[12px] text-brand-muted">{item.sessions[session]?.hours}</span>{/if}
						</span>
						<AppIcon name="chevron" size={20} class="rotate-180 text-brand-muted" />
					</button>
				{/each}
				<p class="m-0 pt-5 text-[12px] leading-5 text-brand-muted">{session === 'night' ? '메뉴와 가격은 확인되는 대로 추가할게요.' : '부스 안내는 확인되는 대로 추가할게요.'}</p>
			{/if}
		</div>
	{/if}
</div>
