<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate, goto } from '$app/navigation';
	import { ArrowLeft, Save, X } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { EVENT_CATEGORIES } from '$lib/domain/campus-events';
	import type { CampusEventDto } from '$lib/server/campus-events';
	import EventImageManager from './EventImageManager.svelte';
	import EventMapPicker from './EventMapPicker.svelte';

	let {
		event = null,
		naverMapClientId,
		action,
		message = '',
		saved = false
	}: {
		event?: CampusEventDto | null;
		naverMapClientId: string;
		action: string;
		message?: string;
		saved?: boolean;
	} = $props();

	let latitude = $state(untrack(() => event?.latitude ?? 36.6095));
	let longitude = $state(untrack(() => event?.longitude ?? 127.287));
	let isVisible = $state(untrack(() => event?.isVisible ?? false));
	let hasUnsavedChanges = $state(false);
	let allowNextNavigation = $state(false);
	let showLeaveDialog = $state(false);
	let pendingNavigationUrl = $state('');
	let isSaving = $state(false);
	let editorForm: HTMLFormElement;

	beforeNavigate((navigation) => {
		if (!hasUnsavedChanges || allowNextNavigation) {
			allowNextNavigation = false;
			return;
		}
		navigation.cancel();
		pendingNavigationUrl = navigation.to?.url.href ?? '/admin/events';
		showLeaveDialog = true;
	});

	function markDirty() {
		hasUnsavedChanges = true;
	}

	const enhanceEditor: SubmitFunction = () => {
		isSaving = true;
		const destination = pendingNavigationUrl;
		return async ({ result, update }) => {
			isSaving = false;
			if (result.type === 'success' || result.type === 'redirect') {
				hasUnsavedChanges = false;
				showLeaveDialog = false;
				pendingNavigationUrl = '';
				if (destination) {
					allowNextNavigation = true;
					await goto(destination);
					return;
				}
			}
			await update();
		};
	};

	function formatKoreanDateTime(value: Date | string | undefined) {
		if (!value) return '';
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
		}).formatToParts(new Date(value));
		const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
		return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
	}
</script>

<main class="min-h-dvh bg-brand-bg text-brand-text">
	<section class="mx-auto min-h-dvh w-full max-w-[720px] bg-white">
		<header class="sticky top-0 z-40 grid h-[calc(56px+env(safe-area-inset-top))] grid-cols-[44px_1fr_44px] items-end border-b border-brand-border bg-white px-3 pb-1 pt-[env(safe-area-inset-top)]">
			<a class="grid h-11 w-11 place-items-center" href="/admin/events" aria-label="행사 목록으로"><ArrowLeft size={20} /></a>
			<h1 class="m-0 self-center text-center text-lg font-black">{event ? '행사 수정' : '행사 등록'}</h1>
			<a class="grid h-11 w-11 place-items-center" href="/my" aria-label="관리자 도구로"><X size={20} /></a>
		</header>

		<form bind:this={editorForm} method="POST" enctype="multipart/form-data" {action} class="grid gap-8 px-5 py-6 pb-[calc(40px+env(safe-area-inset-bottom))]" oninput={markDirty} use:enhance={enhanceEditor}>
			<section class="grid gap-4" aria-labelledby="event-info-title">
				<h2 id="event-info-title" class="m-0 border-b border-brand-border pb-3 text-[15px] font-black">기본 정보</h2>
				<label class="field-label">행사명<input class="field-input" name="title" maxlength="120" value={event?.title ?? ''} required /></label>
				<label class="field-label">카테고리<select class="field-input" name="category" value={event?.category ?? EVENT_CATEGORIES[0]}>{#each EVENT_CATEGORIES as category}<option value={category}>{category}</option>{/each}</select></label>
				<label class="field-label">주최<input class="field-input" name="organizer" maxlength="120" value={event?.organizer ?? ''} required /></label>
				<label class="field-label">상세 설명<textarea class="min-h-36 rounded-xl border border-brand-border p-3 text-sm leading-6" name="description" maxlength="10000" required>{event?.description ?? ''}</textarea></label>
			</section>

			<section class="grid gap-4" aria-labelledby="event-time-title">
				<h2 id="event-time-title" class="m-0 border-b border-brand-border pb-3 text-[15px] font-black">일정과 장소</h2>
				<div class="grid grid-cols-2 gap-3">
					<label class="field-label">시작<input class="field-input" name="startsAt" type="datetime-local" value={formatKoreanDateTime(event?.startsAt)} required /></label>
					<label class="field-label">종료<input class="field-input" name="endsAt" type="datetime-local" value={formatKoreanDateTime(event?.endsAt)} required /></label>
				</div>
				<label class="field-label">장소명<input class="field-input" name="locationName" maxlength="160" value={event?.locationName ?? ''} placeholder="예: 중앙광장" required /></label>
			</section>

			<EventMapPicker clientId={naverMapClientId} bind:latitude bind:longitude onchange={markDirty} />
			<EventImageManager existingImages={event?.images ?? []} onchange={markDirty} />

			<section class="border-y border-brand-border py-3">
				<label class="flex min-h-12 items-center justify-between gap-4 text-sm font-black">사용자에게 공개<span class="flex items-center gap-2 text-[12px] font-medium text-brand-muted">{isVisible ? '공개' : '비공개'}<input class="h-5 w-10 accent-brand" name="isVisible" type="checkbox" bind:checked={isVisible} /></span></label>
				<p class="m-0 text-[12px] leading-5 text-brand-muted">공개하려면 대표 이미지와 모든 필수 정보를 입력해야 합니다.</p>
			</section>

			{#if message}<p class="m-0 rounded-xl bg-red-50 p-3 text-[13px] font-bold text-red-700" role="alert">{message}</p>{/if}
			{#if saved}<p class="m-0 rounded-xl bg-emerald-50 p-3 text-[13px] font-bold text-emerald-700">행사를 저장했습니다.</p>{/if}
			<button class="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-black text-white disabled:opacity-50" type="submit" disabled={isSaving}><Save size={17} />{isSaving ? '저장 중…' : '행사 저장'}</button>
		</form>
	</section>

	{#if showLeaveDialog}
		<div class="fixed inset-0 z-[1000] grid place-items-end bg-black/45 p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:place-items-center" role="presentation">
			<div class="w-full max-w-[430px] bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="event-leave-title">
				<h2 id="event-leave-title" class="m-0 text-base font-black">저장하지 않은 수정사항이 있습니다</h2>
				<p class="m-0 mt-2 text-sm leading-6 text-brand-muted">페이지를 나가기 전에 행사 정보를 저장할까요?</p>
				<div class="mt-5 grid gap-2">
					<button class="h-12 bg-brand text-sm font-black text-white" type="button" disabled={isSaving} onclick={() => editorForm.requestSubmit()}>저장 후 나가기</button>
					<button class="h-11 border-b border-brand-border text-sm font-bold text-red-700" type="button" disabled={isSaving} onclick={async () => { allowNextNavigation = true; showLeaveDialog = false; await goto(pendingNavigationUrl || '/admin/events'); }}>저장하지 않고 나가기</button>
					<button class="h-11 text-sm font-bold text-brand-muted" type="button" disabled={isSaving} onclick={() => { showLeaveDialog = false; pendingNavigationUrl = ''; }}>계속 편집</button>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	.field-label { display:grid; gap:4px; font-size:13px; font-weight:700; }
	.field-input { height:44px; border-bottom:1px solid var(--color-brand-border); padding:0 4px; font-size:14px; }
</style>
