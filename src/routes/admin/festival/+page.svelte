<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import FestivalAreaEditor from '$lib/festival/FestivalAreaEditor.svelte';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import type { PageData, ActionData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let area = $state(untrack(() => structuredClone(data.draft.festival.area)));
	let revision = $state(untrack(() => data.draft.revision));
	let dirty = $state(false);
	let saving = $state(false);
	let showSavedToast = $state(false);
	$effect(() => {
		if (!showSavedToast) return;
		const timer = window.setTimeout(() => showSavedToast = false, 3000);
		return () => window.clearTimeout(timer);
	});
	const initial = untrack(() => data.draft.festival);
	const times = (session: 'day' | 'night') => initial.dates[0]?.hours[session]?.replace('다음 날 ','').split('–').map((time) => time === '24:00' ? '00:00' : time) ?? ['',''];
	beforeNavigate((navigation) => { if (dirty && !window.confirm('저장하지 않은 축제 편집을 나갈까요?')) navigation.cancel(); });
	const submit: SubmitFunction = () => {
		saving = true;
		showSavedToast = false;
		return async ({ result, update }) => {
			saving = false;
			if (result.type === 'success' && result.data?.saved) {dirty = false;revision = Number(result.data.revision);}
			await update({ reset: false });
			if (result.type === 'success' && result.data?.saved) showSavedToast = true;
		};
	};
</script>

<svelte:head><title>축제 구역 편집 | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-white text-brand-text">
	<header class="sticky top-0 z-30 border-b border-brand-border bg-white pt-[env(safe-area-inset-top)]"><div class="relative mx-auto flex h-14 max-w-[800px] items-center justify-center px-5"><a href="/admin/events" class="absolute left-4" aria-label="행사 관리로 돌아가기"><AppIcon name="chevron" /></a><h1 class="m-0 text-[18px] font-bold">축제 구역 편집</h1></div></header>
	<form method="POST" use:enhance={submit} oninput={() => dirty = true} class="mx-auto max-w-[800px] px-5 pt-5 pb-28">
		<p class="m-0 mb-5 text-[13px] leading-5 text-brand-muted">저장한 설정은 지도와 오늘 탭에 함께 반영돼요. 반영까지 잠시 걸릴 수 있어요.</p>
		{#if data.draft.updatedAt}<p class="mb-5 text-[12px] text-brand-muted">최근 저장 · {new Intl.DateTimeFormat('ko-KR', { dateStyle:'short', timeStyle:'short', timeZone:'Asia/Seoul' }).format(new Date(data.draft.updatedAt))}</p>{/if}
		<input type="hidden" name="revision" value={revision} /><input type="hidden" name="boundary" value={JSON.stringify(area.boundary)} /><input type="hidden" name="latitude" value={area.latitude} /><input type="hidden" name="longitude" value={area.longitude} />
		<div class="grid gap-5 sm:grid-cols-2"><label>축제명 · 바텀시트 제목<input name="name" required maxlength="80" value={initial.name} /></label><label>지도 표시 이름<input name="mapLabel" required maxlength="80" value={initial.mapLabel || initial.name} /></label><label>장소명<input name="location" required maxlength="80" bind:value={area.label} /></label></div>
		<section class="mt-7"><h2 class="m-0 mb-3 text-[15px] font-bold">지도 구역과 대표 핀</h2><FestivalAreaEditor clientId={data.naverMapClientId} bind:area onchange={() => dirty = true} /><label class="mt-4 !flex items-center gap-2"><input type="checkbox" name="boundaryConfirmed" checked={!initial.area.approximate} class="!h-4 !w-4 accent-brand" />실제 행사 구역을 확인했어요</label><p class="mt-2 text-[12px] text-brand-muted">확인 전에는 지도에 ‘구역 시안’으로 표시됩니다.</p></section>
		<section class="mt-7"><h2 class="m-0 mb-4 text-[15px] font-bold">행사 일정</h2><label>날짜<input type="date" name="date" value={initial.dates[0]?.date} required /></label><p class="mt-2 text-[12px] text-brand-muted">전체 운영시간이 아직 미정이면 비워두세요. 개별 부스 시간은 유지됩니다.</p>
			{#each [{id:'day' as const,label:'낮'},{id:'night' as const,label:'밤'}] as session}<div class="mt-4 grid grid-cols-2 gap-4"><label>{session.label} 시작<input type="time" name={`${session.id}Start`} value={times(session.id)[0]} /></label><label>{session.label} 종료<input type="time" name={`${session.id}End`} value={times(session.id)[1]} /></label></div>{/each}
		</section>
		{#if form?.message}<p role="status" class={`mt-5 border-t border-brand-border py-4 text-[13px] ${form.saved ? 'text-brand' : 'text-red-700'}`}>{form.message}</p>{/if}
		<div class="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"><div class="mx-auto flex max-w-[760px] items-center gap-5"><a class="shrink-0 text-[13px] text-brand-muted" href="/?panel=festival">지도 미리보기</a><button class="h-12 flex-1 rounded-[10px] bg-brand text-[14px] font-bold text-white disabled:opacity-50" type="submit" disabled={saving}>{saving ? '저장 중…' : '축제 구역 저장'}</button></div></div>
	</form>
</main>
<div role="status" aria-live="polite" aria-atomic="true" class="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-40 flex justify-center px-5">
	{#if showSavedToast}
		<p class="m-0 rounded-[12px] bg-brand-text px-5 py-3 text-[13px] font-medium text-white shadow-sm">축제 설정을 저장했어요.</p>
	{/if}
</div>
<style>
	label{display:grid;gap:6px;font-size:13px;font-weight:700}
	input:not([type=hidden]){height:44px;min-width:0;width:100%;border-bottom:1px solid var(--color-brand-border);font-size:14px;font-weight:400;background:transparent}
</style>
