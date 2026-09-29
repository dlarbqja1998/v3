<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { EVENT_CATEGORIES } from '$lib/domain/campus-events';
	import type { CampusEventLocation } from '$lib/domain/event-locations';
	import EventMapPicker from '$lib/events/EventMapPicker.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
	let latitude = $state(untrack(() => data.candidate.draft.latitude ?? 36.6095));
	let longitude = $state(untrack(() => data.candidate.draft.longitude ?? 127.287));
	let location = $state<CampusEventLocation | null>(untrack(() => data.candidate.draft.location));
	let locationName = $state(untrack(() => data.candidate.draft.locationName));
	let positionChosen = $state(untrack(() => data.candidate.draft.latitude !== null && data.candidate.draft.longitude !== null));
	let saving = $state(false);
	let useSuggestion = $state(false);
	const shownDraft = $derived(useSuggestion && data.candidate.suggestedDraft ? data.candidate.suggestedDraft : data.candidate.draft);
	const editable = $derived(data.candidate.state === 'pending');
	function datetime(value: string | null) {
		if (!value) return '';
		const date = new Date(new Date(value).getTime() + 9 * 60 * 60 * 1000);
		return date.toISOString().slice(0, 16);
	}
	const save: SubmitFunction = () => {
		saving = true;
		return async ({ update }) => { try { await update({ reset: false }); } finally { saving = false; } };
	};
</script>

<svelte:head><title>행사 후보 확인 | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-brand-bg text-brand-text">
	<section class="mx-auto min-h-dvh max-w-[720px] bg-white">
		<header class="sticky top-0 z-30 grid min-h-[calc(56px+env(safe-area-inset-top))] grid-cols-[64px_1fr_64px] items-center border-b border-brand-border bg-white px-3 pt-[env(safe-area-inset-top)]"><a href="/admin/events/inbox" class="grid min-h-11 place-items-center text-[13px] text-brand-muted">승인함</a><h1 class="m-0 text-center text-lg font-bold">행사 후보 확인</h1><span></span></header>
		<div class="px-5 pb-[calc(40px+env(safe-area-inset-bottom))]">
			<section class="py-6"><p class="m-0 text-[12px] text-brand-muted">{data.candidate.state === 'published' ? '게시 완료' : data.candidate.state === 'rejected' ? '제외한 후보' : '검토 중'}</p><h2 class="m-0 mt-2 text-[22px] font-bold leading-8">{data.candidate.draft.title}</h2>{#if data.issues.length && editable}<p class="m-0 mt-3 text-[13px] leading-6 text-brand">{data.issues.join(' · ')}</p>{/if}</section>
			<section class="gb1-section"><h2 class="gb1-section-title">원문</h2>{#each data.candidate.sources as source}<div class="border-b border-brand-border py-3"><a href={source.url} target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center text-[13px] font-bold text-brand">{source.board} · {source.title || '게시글 확인'}</a><p class="m-0 whitespace-pre-line text-[13px] leading-6 text-brand-muted">{source.evidence}</p></div>{/each}</section>
			{#if data.candidate.publishedEventId}<a class="mb-5 inline-flex min-h-11 items-center text-[13px] text-brand" href={`/admin/events/${data.candidate.publishedEventId}/edit`}>기존 행사 확인·수정</a>{/if}
			{#if data.candidate.suggestedDraft && editable}<section class="gb1-section"><h2 class="gb1-section-title">원문 변경</h2><p class="text-[13px] leading-6 text-brand-muted">저장한 내용은 유지했어요. 원문과 아래 변경 내용을 확인한 뒤 필요한 값을 반영해 주세요.</p><dl class="text-[13px] leading-6"><dt class="font-bold">새로 확인한 일정</dt><dd class="m-0">{datetime(data.candidate.suggestedDraft.startsAt).replace('T', ' ') || '미확인'} – {datetime(data.candidate.suggestedDraft.endsAt).replace('T', ' ') || '미확인'}</dd><dt class="mt-2 font-bold">새로 확인한 장소</dt><dd class="m-0">{data.candidate.suggestedDraft.locationName || '미확인'}</dd></dl><button type="button" class="min-h-11 text-[13px] font-bold text-brand" onclick={() => { useSuggestion = true; locationName = data.candidate.suggestedDraft!.locationName; positionChosen = false; location = null; }}>변경 내용을 입력란에 반영</button></section>{/if}
			<form method="POST" action="?/save" enctype="multipart/form-data" use:enhance={save}>
				<input type="hidden" name="version" value={data.candidate.version} />
				<fieldset disabled={!editable || saving} class="m-0 min-w-0 border-0 p-0">
					<section class="gb1-section grid gap-4"><h2 class="gb1-section-title">행사 정보</h2>
						<label class="field">행사명<input name="title" value={shownDraft.title} maxlength="120" /></label>
						<label class="field">분류<select name="category" value={shownDraft.category}>{#each EVENT_CATEGORIES as category}<option value={category}>{category}</option>{/each}</select></label>
						<label class="field">주최<input name="organizer" value={shownDraft.organizer} maxlength="120" /></label>
						<label class="field">설명<textarea name="description" rows="5" maxlength="10000" value={shownDraft.description}></textarea></label>
						<label class="field">시작 일시 · 한국 시간<input type="datetime-local" name="startsAt" value={datetime(shownDraft.startsAt)} /></label>
						<label class="field">종료 일시 · 한국 시간<input type="datetime-local" name="endsAt" value={datetime(shownDraft.endsAt)} /></label>
						<label class="field">안내·신청 링크<input name="externalUrl" type="url" value={shownDraft.externalUrl ?? ''} /></label>
					</section>
					<section class="gb1-section"><h2 class="gb1-section-title">장소</h2>
						<label class="field">장소명<input name="locationName" bind:value={locationName} maxlength="160" /></label>
						<a class="inline-flex min-h-11 items-center text-[13px] text-brand" href={`/admin/events/locations?candidate=${data.candidate.id}`}>구역·핀 설정에서 크게 보기</a>
						<input type="hidden" name="latitude" value={positionChosen ? latitude : ''} /><input type="hidden" name="longitude" value={positionChosen ? longitude : ''} /><input type="hidden" name="location" value={positionChosen && location ? JSON.stringify(location) : ''} />
						<p class="text-[12px] text-brand-muted">{positionChosen ? '지정한 위치를 저장합니다.' : '장소를 선택하거나 지도에 위치를 지정해 주세요.'}</p>
						<EventMapPicker clientId={data.naverMapClientId} bind:latitude bind:longitude bind:location bind:locationName {positionChosen} onchange={(chosen = true) => { positionChosen = chosen; }} />
					</section>
					<section class="gb1-section"><h2 class="gb1-section-title">대표 이미지</h2>
						{#if data.candidate.coverImage}<img src={`/admin/events/inbox/${data.candidate.id}/image?v=${data.candidate.version}`} alt={`${data.candidate.draft.title} 포스터 후보`} class="my-4 max-h-[420px] w-full object-contain" />{/if}
						<label class="field mt-4">이미지 추가·교체<input type="file" name="cover" accept="image/jpeg,image/png,image/webp" /></label>
						<label class="mt-3 flex min-h-11 items-center gap-3 text-[13px] leading-5"><input type="checkbox" name="coverApproved" checked={data.candidate.coverApproved} class="h-5 w-5 shrink-0 accent-brand" />이 이미지를 행사 대표 이미지로 사용할 수 있어요.</label>
					</section>
					{#if data.candidate.reviewFlags.length}<label class="mb-5 flex min-h-11 items-center gap-3 text-[13px]"><input type="checkbox" name="acknowledged" class="h-5 w-5 accent-brand" />원문의 변경·취소 안내를 확인하고 내용을 보완했어요.</label>{/if}
					{#if editable}<button type="submit" disabled={saving} class="min-h-12 w-full rounded-xl bg-brand text-[14px] font-bold text-white disabled:opacity-50">{saving ? '저장 중…' : '후보 저장'}</button>{/if}
				</fieldset>
			</form>
			{#if form?.message}<p class="py-3 text-[13px] leading-6 text-brand" role="status">{form.message}</p>{/if}
			{#if editable}<form method="POST" action="?/reject" class="mt-5"><input type="hidden" name="version" value={data.candidate.version} /><button type="submit" class="min-h-11 text-[13px] text-brand-muted">이 후보 제외하기</button></form>{:else if data.candidate.state === 'rejected'}<form method="POST" action="?/restore" class="mt-5"><input type="hidden" name="version" value={data.candidate.version} /><button type="submit" class="min-h-11 text-[13px] text-brand">검토 대기로 되돌리기</button></form>{/if}
		</div>
	</section>
</main>
<style>.field { display: grid; gap: 6px; font-size: 13px; font-weight: 700; } .field input,.field select,.field textarea { min-height: 44px; min-width: 0; width: 100%; border-bottom: 1px solid var(--color-brand-border); padding: 8px 0; font-size: 13px; font-weight: 400; } .field textarea { line-height: 1.7; }</style>
