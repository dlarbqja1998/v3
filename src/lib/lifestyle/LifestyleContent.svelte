<script lang="ts">
	import { preloadData } from '$app/navigation';
	import { createAsyncDataCache } from '$lib/cache/async-data-cache';
	import type { LifestyleView } from './navigation';
	import type { PageData as CafeteriaData } from '../../routes/cafeteria/$types';
	import type { PageData as ShuttleData } from '../../routes/shuttle/$types';
	import type { PageData as TodayData } from '../../routes/today/$types';
	import type { PageData as EventData } from '../../routes/today/[id]/$types';
	import type CafeteriaPage from '../../routes/cafeteria/+page.svelte';
	import type ShuttlePage from '../../routes/shuttle/+page.svelte';
	import type TodayPage from '../../routes/today/+page.svelte';
	import type EventPage from '../../routes/today/[id]/+page.svelte';

	let { view, url, onEvent, onMap }: { view: LifestyleView | null; url: URL; onEvent: (id: string) => void; onMap: (href: string) => void } = $props();
	let Cafeteria = $state<typeof CafeteriaPage>();
	let Shuttle = $state<typeof ShuttlePage>();
	let Today = $state<typeof TodayPage>();
	let EventDetail = $state<typeof EventPage>();
	let cafeteriaData = $state<CafeteriaData>();
	let shuttleData = $state<ShuttleData>();
	let todayData = $state<TodayData>();
	let eventData = $state<EventData>();
	let cafeteriaKey = $state('');
	let shuttleKey = $state('');
	let eventKey = $state('');
	let error = $state('');
	let loading = $state(false);
	let retry = $state(0);
	const detail = $derived(view === 'today' ? url.searchParams.get('detail') : null);
	// 홈 인스턴스에 귀속된 캐시라 로그인 세션 사이에 개인정보가 공유되지 않는다.
	const cache = createAsyncDataCache<Record<string, unknown>>(60_000, 12);
	const ready = $derived(view === 'cafeteria' ? Boolean(Cafeteria && cafeteriaData) : view === 'shuttle' ? Boolean(Shuttle && shuttleData) : detail ? Boolean(EventDetail && eventKey === detail && eventData) : Boolean(Today && todayData));

	$effect(() => {
		retry;
		if (!view) return;
		const selected = view;
		const eventId = detail;
		const params = new URLSearchParams({ embedded: '1' });
		for (const key of selected === 'cafeteria' ? ['cafeteria', 'day'] : selected === 'shuttle' ? ['stop'] : []) {
			const value = url.searchParams.get(key);
			if (value) params.set(key, value);
		}
		const href = `/${selected}${eventId ? `/${encodeURIComponent(eventId)}` : ''}?${params}`;
		let cancelled = false;
		loading = true;
		error = '';
		async function load() {
			const moduleRequest = selected === 'cafeteria' ? import('../../routes/cafeteria/+page.svelte') : selected === 'shuttle' ? import('../../routes/shuttle/+page.svelte') : eventId ? import('../../routes/today/[id]/+page.svelte') : import('../../routes/today/+page.svelte');
			const dataRequest = cache.read(href, async () => {
				let timeout: ReturnType<typeof setTimeout> | undefined;
				try {
					const result = await Promise.race([
						preloadData(href),
						new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('연결 지연')), 15_000); })
					]);
					if (result.type !== 'loaded' || result.status >= 400) throw new Error('불러오기 실패');
					return result.data;
				} finally { clearTimeout(timeout); }
			});
			const [module, data] = await Promise.all([moduleRequest, dataRequest]);
			if (cancelled) return;
			error = '';
			if (selected === 'cafeteria') { Cafeteria = module.default as typeof CafeteriaPage; cafeteriaData = data as CafeteriaData; cafeteriaKey = params.toString(); }
			else if (selected === 'shuttle') { Shuttle = module.default as typeof ShuttlePage; shuttleData = data as ShuttleData; shuttleKey = params.toString(); }
			else if (eventId) { EventDetail = module.default as typeof EventPage; eventData = data as EventData; eventKey = eventId; }
			else { Today = module.default as typeof TodayPage; todayData = data as TodayData; }
		}
		void load().catch(() => { if (!cancelled) error = '정보를 불러오지 못했어요. 다시 시도해 주세요.'; }).finally(() => { if (!cancelled) loading = false; });
		return () => { cancelled = true; };
	});
</script>

{#if !ready}
	<div class="px-5 py-8" aria-live="polite" aria-busy={loading}>
		{#if error}<p class="text-[13px] text-brand-muted">{error}</p><button type="button" class="min-h-11 text-[13px] font-bold text-brand" onclick={() => retry++}>다시 시도</button>
		{:else}<p class="mb-6 text-[13px] text-brand-muted">정보를 불러오고 있어요</p><div class="space-y-5 motion-safe:animate-pulse" aria-hidden="true"><div class="h-5 w-2/3 rounded bg-brand-map"></div><div class="h-24 border-y border-brand-border"></div><div class="h-5 w-1/2 rounded bg-brand-map"></div></div>{/if}
	</div>
{:else if error}
	<div class="border-b border-brand-border px-5 py-2 text-[12px] text-brand-muted" role="status">새 정보를 가져오지 못했어요. 마지막으로 확인한 내용이에요. <button class="min-h-11 text-brand" onclick={() => retry++}>다시 시도</button></div>
{/if}

<div class="content-pane" hidden={view !== 'cafeteria' || !ready} inert={view !== 'cafeteria'}>
	{#if Cafeteria && cafeteriaData}{#key cafeteriaKey}<Cafeteria data={cafeteriaData} form={null} embedded active={view === 'cafeteria'} {onMap} />{/key}{/if}
</div>
<div class="content-pane" hidden={view !== 'shuttle' || !ready} inert={view !== 'shuttle'}>
	{#if Shuttle && shuttleData}{#key shuttleKey}<Shuttle data={shuttleData} embedded active={view === 'shuttle'} {onMap} />{/key}{/if}
</div>
<div class="content-pane" hidden={view !== 'today' || Boolean(detail) || !ready} inert={view !== 'today' || Boolean(detail)}>
	{#if Today && todayData}<Today data={todayData} embedded active={view === 'today' && !detail} {onEvent} {onMap} />{/if}
</div>
<div class="content-pane" hidden={view !== 'today' || !detail || !ready} inert={view !== 'today' || !detail}>
	{#if EventDetail && eventData}{#key eventKey}<EventDetail data={eventData} embedded active={view === 'today' && Boolean(detail)} {onMap} onBack={() => onEvent('')} />{/key}{/if}
</div>

<style>
	.content-pane { height: 100%; min-height: 0; overflow: hidden; }
	.content-pane[hidden] { display: none; }
</style>
