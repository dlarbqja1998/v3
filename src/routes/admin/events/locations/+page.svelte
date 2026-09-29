<script lang="ts">
	import { untrack } from 'svelte';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import EventLocationEditor from '$lib/events/EventLocationEditor.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	let selectedKey = $state(untrack(() => data.initialKey));
	let dirty = $state(false);
	const selected = $derived(data.entries.find((entry) => entry.key === selectedKey));
	function changeEntry(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		if (dirty && !window.confirm('저장하지 않은 위치를 두고 다른 행사를 선택할까요?')) { select.value = selectedKey; return; }
		selectedKey = select.value; dirty = false;
	}
</script>

<svelte:head><title>행사 구역·핀 설정 | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-white text-brand-text">
	<header class="sticky top-0 z-30 border-b border-brand-border bg-white pt-[env(safe-area-inset-top)]"><div class="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-5"><a class="absolute left-3 grid h-11 w-11 place-items-center" href="/admin/events" aria-label="행사 관리로 돌아가기"><AppIcon name="chevron" size={20} /></a><h1 class="m-0 text-center text-[18px] font-bold">행사 구역·핀 설정</h1></div></header>
	<div class="mx-auto max-w-[720px] px-5 pt-5 pb-[calc(112px+env(safe-area-inset-bottom))]">
		{#if data.entries.length}
			<label class="grid gap-2 text-[13px] font-bold">행사 선택<select class="min-h-12 w-full min-w-0 border-b border-brand-border bg-white text-[13px] font-normal" value={selectedKey} onchange={changeEntry}>{#each data.entries as entry}<option value={entry.key}>{entry.title} · {entry.status}</option>{/each}</select></label>
			{#if selected}{#key selectedKey}<EventLocationEditor entry={selected} clientId={data.naverMapClientId} ondirty={(value) => dirty = value} />{/key}{/if}
		{:else}
			<p class="m-0 py-6 text-[13px] leading-6 text-brand-muted">위치를 지정할 행사가 없습니다. 행사를 등록하거나 승인함의 후보를 확인해 주세요.</p>
			<a href="/admin/events/new" class="inline-flex min-h-11 items-center text-[13px] font-bold text-brand">새 행사 등록</a>
		{/if}
	</div>
</main>
