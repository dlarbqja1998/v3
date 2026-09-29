<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { EventCandidateRow, EventImportRunRow } from '$lib/server/event-candidates';
	import { EVENT_CANDIDATE_BATCH_LIMIT } from '$lib/domain/event-candidates';

	let { data, form = null, preview = false }: {
		data: { available: boolean; candidates: (EventCandidateRow & { issues: string[] })[]; runs: EventImportRunRow[] };
		form?: { message?: string; results?: { id: string; ok: boolean; message: string }[] } | null;
		preview?: boolean;
	} = $props();
	let tab = $state('pending');
	let selected = $state<string[]>([]);
	let submitting = $state(false);
	const tabs = [{ id: 'pending', label: '검토 대기' }, { id: 'incomplete', label: '정보 부족' }, { id: 'published', label: '게시 완료' }, { id: 'rejected', label: '제외' }];
	const pending = $derived(data.candidates.filter((candidate) => candidate.state === 'pending'));
	const ready = $derived(pending.filter((candidate) => candidate.issues.length === 0));
	const visible = $derived(data.candidates.filter((candidate) => tab === 'incomplete' ? candidate.state === 'pending' && candidate.issues.length > 0 : candidate.state === tab));
	const latest = $derived(data.runs[0]);
	const selectedCandidates = $derived(visible.filter((candidate) => selected.includes(candidate.id) && candidate.state === 'pending' && candidate.issues.length === 0));
	function formatDate(value: Date | string | null, time = true) {
		if (!value) return '일시 확인 필요';
		return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' as const } : {}) }).format(new Date(value));
	}
	function choose(id: string, checked: boolean) {
		selected = checked ? [...selected, id].slice(0, EVENT_CANDIDATE_BATCH_LIMIT) : selected.filter((value) => value !== id);
	}
	function formatEnd(start: string | null, end: string) {
		const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
		if (!start || day.format(new Date(start)) !== day.format(new Date(end))) return formatDate(end);
		return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(end));
	}
	const enhancePublish: SubmitFunction = ({ cancel }) => {
		if (preview) { cancel(); return; }
		submitting = true;
		return async ({ result, update }) => {
			try {
				if (result.type === 'success' && result.data?.results) {
					const done = (result.data.results as { id: string; ok: boolean }[]).filter((item) => item.ok).map((item) => item.id);
					selected = selected.filter((id) => !done.includes(id));
				}
				await update({ reset: false });
			} finally { submitting = false; }
		};
	};
</script>

<svelte:head><title>행사 승인함 | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text">
	<section class="mx-auto min-h-dvh w-full max-w-[720px] bg-white">
		<header class="sticky top-0 z-30 grid min-h-[calc(56px+env(safe-area-inset-top))] grid-cols-[64px_1fr_64px] items-center border-b border-brand-border bg-white px-3 pt-[env(safe-area-inset-top)]">
			<a href="/my" class="grid min-h-11 place-items-center text-[13px] text-brand-muted">마이</a>
			<h1 class="m-0 text-center text-lg font-bold">행사 승인함</h1>
			<a href="/admin/events" class="grid min-h-11 place-items-center text-[13px] text-brand-muted">행사 관리</a>
		</header>
		<div class="px-5 pb-[calc(116px+env(safe-area-inset-bottom))]">
			{#if preview}<p class="border-b border-brand-border py-3 text-[12px] text-brand-muted">화면 미리보기 · 예시 데이터이며 실제로 게시되지 않아요.</p>{/if}
			<section class="py-6" aria-label="행사 수집 상태">
				<p class="m-0 text-[12px] text-brand-muted">자유게시판 · 홍보게시판</p>
				<h2 class="m-0 mt-2 text-[24px] font-bold tracking-tight">확인할 행사 <span class="text-brand">{pending.length}</span></h2>
				<p class="m-0 mt-2 text-[13px] text-brand-muted">게시 가능 {ready.length}개 · 정보 확인 {pending.length - ready.length}개</p>
				<div class="mt-5 border-t border-brand-border pt-3 text-[12px] leading-6 text-brand-muted">
					<p class="m-0 font-bold">요청할 때 확인</p>
					<p class="m-0">확인을 요청해 모은 후보를 검토하고 게시해 주세요.</p>
					{#if latest}
						<p class="m-0">마지막 후보 저장 {formatDate(latest.finishedAt ?? latest.startedAt)}</p>
						<p class="m-0" class:text-brand={latest.status !== 'completed'}>{latest.status === 'running' ? '후보 저장 결과를 아직 확인하지 못했어요.' : latest.message}</p>
					{/if}
					{#if !data.available}<p class="m-0 text-brand">승인함 저장소를 준비 중입니다. 연결 후 후보를 받을 수 있어요.</p>{/if}
				</div>
				<div class="mt-2 flex items-center gap-5 text-[13px] text-brand-muted">
					<a href={preview ? '/dev/event-inbox' : '/admin/events/inbox'} class="inline-flex min-h-11 items-center">새로고침</a>
				</div>
			</section>
			<nav class="-mx-5 flex justify-between border-y border-brand-section-border px-5" aria-label="후보 상태">
				{#each tabs as item}<button type="button" class={`min-h-12 border-b-2 text-[13px] transition-colors duration-200 ${tab === item.id ? 'border-brand font-bold text-brand' : 'border-transparent text-brand-muted'}`} onclick={() => { tab = item.id; selected = []; }}>{item.label}</button>{/each}
			</nav>
			{#if form?.message}<p class="border-b border-brand-border py-4 text-[13px] font-bold" role="status">{form.message}</p>{/if}
			<form method="POST" action="?/publish" use:enhance={enhancePublish}>
				{#if visible.length === 0}
					<div class="py-16 text-center"><p class="m-0 text-[15px] font-bold">{tab === 'pending' ? '새 행사 후보를 기다리고 있어요' : '이 상태의 행사가 없어요'}</p><p class="m-0 mt-2 text-[13px] leading-6 text-brand-muted">{tab === 'pending' ? '확인한 공지가 여기에 모이면 올릴 것만 선택해 주세요.' : '다른 목록에서 행사 후보를 확인해 주세요.'}</p></div>
				{:else}
					{#each visible as candidate (candidate.id)}
						<article class="border-b border-brand-border py-5">
							<div class="flex items-start gap-2">
								{#if candidate.state === 'pending'}<label class="-ml-2 flex min-h-11 w-11 shrink-0 items-center justify-center"><input type="checkbox" name="candidate" value={`${candidate.id}:${candidate.version}`} checked={selected.includes(candidate.id)} onchange={(event) => choose(candidate.id, event.currentTarget.checked)} disabled={candidate.issues.length > 0 || submitting || (!selected.includes(candidate.id) && selectedCandidates.length >= EVENT_CANDIDATE_BATCH_LIMIT)} class="h-5 w-5 accent-brand disabled:opacity-30" aria-label={`${candidate.draft.title} 게시 대상으로 선택`} /></label>{/if}
								<div class="min-w-0 flex-1">
									<p class="m-0 text-[11px] text-brand-muted">{[...new Set(candidate.sources.map((source) => source.board))].join(' · ')}{candidate.sources.length > 1 ? ` · 출처 ${candidate.sources.length}개` : ''}</p>
									<a href={preview ? '#' : `/admin/events/inbox/${candidate.id}`} class="block min-h-11 py-2" onclick={(event) => { if (preview) event.preventDefault(); }}><h3 class="m-0 text-[16px] font-bold leading-6">{candidate.draft.title}</h3></a>
									<p class="m-0 text-[13px] leading-6">{formatDate(candidate.draft.startsAt)}{candidate.draft.endsAt ? ` – ${formatEnd(candidate.draft.startsAt, candidate.draft.endsAt)}` : candidate.draft.startsAt ? '부터' : ''}</p>
									<p class="m-0 text-[13px] leading-6 text-brand-muted">{candidate.draft.locationName || '장소 확인 필요'}</p>
									{#if candidate.state === 'pending'}<p class={`m-0 mt-2 text-[12px] leading-5 ${candidate.issues.length ? 'text-brand-muted' : 'text-brand'}`}>{candidate.issues.length ? candidate.issues.slice(0, 3).join(' · ') : candidate.publishedEventId ? '변경 내용 게시 가능' : '게시 가능'}</p>{/if}
									{#each form?.results?.filter((result) => result.id === candidate.id && !result.ok) ?? [] as result}<p class="mt-2 text-[12px] text-red-700" role="alert">{result.message}</p>{/each}
								</div>
								<a href={preview ? '#' : `/admin/events/inbox/${candidate.id}`} class="inline-flex min-h-11 shrink-0 items-center text-[12px] text-brand-muted" onclick={(event) => { if (preview) event.preventDefault(); }}>{candidate.issues.length && candidate.state === 'pending' ? '보완' : '상세'}</a>
							</div>
						</article>
					{/each}
				{/if}
				{#if tab === 'pending' || tab === 'incomplete'}
					<div class="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[720px] border-t border-brand-section-border bg-white px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
						<p class="m-0 mb-2 text-center text-[11px] text-brand-muted">선택한 행사만 골라바유에 공개돼요.</p>
						<button type="submit" class="min-h-12 w-full rounded-xl bg-brand text-[14px] font-bold text-white disabled:bg-brand-map disabled:text-brand-muted" disabled={!selectedCandidates.length || submitting} aria-busy={submitting}>{submitting ? '게시하고 있어요…' : selectedCandidates.length ? `선택한 ${selectedCandidates.length}개 승인·게시` : '게시할 행사를 선택해 주세요'}</button>
					</div>
				{/if}
			</form>
		</div>
	</section>
</main>
