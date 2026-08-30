<script lang="ts">
	import { ArrowLeft, ChevronRight, Plus, Trash2 } from '@lucide/svelte';
	import { getCampusEventStatus } from '$lib/domain/campus-events';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const now = new Date();

	function statusLabel(event: PageData['events'][number]) {
		const status = getCampusEventStatus(event, now);
		return status === 'ongoing' ? '진행 중' : status === 'upcoming' ? '진행 예정' : '종료';
	}

	function formatPeriod(startsAt: Date, endsAt: Date) {
		const formatter = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
		return `${formatter.format(startsAt)} – ${formatter.format(endsAt)}`;
	}

	function confirmDelete(event: SubmitEvent, title: string) {
		if (window.confirm(`“${title}” 행사를 영구 삭제할까요? 연결된 이미지도 함께 삭제됩니다.`)) return;
		event.preventDefault();
	}
</script>

<svelte:head><title>행사 관리 | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text">
	<section class="mx-auto min-h-dvh w-full max-w-[720px] bg-white">
		<header class="sticky top-0 z-30 grid h-[calc(56px+env(safe-area-inset-top))] grid-cols-[44px_1fr_44px] items-end border-b border-brand-border bg-white px-3 pb-1 pt-[env(safe-area-inset-top)]">
			<a class="grid h-11 w-11 place-items-center" href="/my" aria-label="마이로 돌아가기"><ArrowLeft size={20} /></a>
			<h1 class="m-0 self-center text-center text-lg font-black">행사 관리</h1>
			<a class="grid h-11 w-11 place-items-center text-brand" href="/admin/events/new" aria-label="새 행사 등록"><Plus size={21} /></a>
		</header>

		<div class="px-5 py-5 pb-[calc(40px+env(safe-area-inset-bottom))]">
			<div class="mb-4 flex items-end justify-between gap-4 border-b border-brand-border pb-3">
				<div><h2 class="m-0 text-[15px] font-black">등록 행사</h2><p class="m-0 mt-1 text-[13px] text-brand-muted">종료 행사도 관리자 목록에는 유지됩니다.</p></div>
				<a class="text-[13px] font-black text-brand" href="/admin/events/new">새 행사</a>
			</div>

			{#if form?.message}<p class="mb-3 rounded-xl bg-red-50 p-3 text-[13px] font-bold text-red-700">{form.message}</p>{/if}
			{#if data.deleted}<p class="mb-3 rounded-xl bg-emerald-50 p-3 text-[13px] font-bold text-emerald-700">행사를 삭제했습니다.</p>{/if}

			{#if data.events.length === 0}
				<div class="py-16 text-center"><p class="m-0 text-sm font-bold">아직 등록한 행사가 없습니다.</p><a class="mt-3 inline-block text-[13px] font-black text-brand" href="/admin/events/new">첫 행사 등록하기</a></div>
			{:else}
				<div class="divide-y divide-brand-border border-b border-brand-border">
					{#each data.events as event (event.id)}
						<article class="py-4">
							<div class="flex items-start gap-3">
								<a class="min-w-0 flex-1" href={`/admin/events/${event.id}/edit`}>
									<div class="flex items-center gap-2 text-[12px] font-bold"><span class="text-brand">{event.category}</span><span class="text-brand-muted">{statusLabel(event)}</span></div>
									<h3 class="m-0 mt-1 truncate text-[15px] font-black">{event.title}</h3>
									<p class="m-0 mt-1 text-[12px] text-brand-muted">{formatPeriod(event.startsAt, event.endsAt)} · {event.locationName}</p>
								</a>
								<a class="grid h-10 w-10 shrink-0 place-items-center text-brand-muted" href={`/admin/events/${event.id}/edit`} aria-label={`${event.title} 수정`}><ChevronRight size={18} /></a>
							</div>
							<div class="mt-3 flex items-center justify-between border-t border-brand-border pt-2">
								<form method="POST" action="?/toggleVisibility">
									<input type="hidden" name="id" value={event.id} />
									<input type="hidden" name="isVisible" value={event.isVisible ? 'false' : 'true'} />
									<button class={`min-h-9 text-[12px] font-black ${event.isVisible ? 'text-brand' : 'text-brand-muted'}`} type="submit">{event.isVisible ? '공개 중 · 비공개로' : '비공개 · 공개하기'}</button>
								</form>
								<form method="POST" action="?/delete" onsubmit={(submitEvent) => confirmDelete(submitEvent, event.title)}>
									<input type="hidden" name="id" value={event.id} />
									<button class="flex min-h-9 items-center gap-1 text-[12px] font-bold text-red-700" type="submit"><Trash2 size={14} />삭제</button>
								</form>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</main>
