<script lang="ts">
	import { ChevronLeft, ChevronRight, Pin } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(value: Date | string | null) {
		if (!value) return '';
		return new Intl.DateTimeFormat('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(new Date(value));
	}
</script>

<svelte:head><title>공지사항 | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section class="min-h-dvh w-full bg-white md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:overflow-hidden md:rounded-[28px] md:border md:border-brand-border-strong">
		<header class="sticky top-0 z-10 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border bg-white px-2">
			<a class="grid h-11 w-11 place-items-center text-brand-text" href="/my" aria-label="마이페이지로 돌아가기"><ChevronLeft size={22} /></a>
			<h1 class="m-0 text-center text-lg font-black">공지사항</h1>
			<span></span>
		</header>

		<div class="px-5 pb-[calc(32px+env(safe-area-inset-bottom))]">
			{#if data.notices.length === 0}
				<p class="m-0 py-16 text-center text-sm font-bold text-brand-muted">등록된 공지사항이 없습니다.</p>
			{:else}
				<div class="border-b border-brand-border">
					{#each data.notices as notice}
						<a class="flex min-h-16 items-center gap-3 border-t border-brand-border py-3 first:border-t-0" href={`/notices/${notice.id}`}>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-1.5">
									{#if notice.isPinned}<span class="inline-flex items-center gap-1 text-xs font-black text-brand"><Pin size={12} />고정</span>{/if}
									<p class="m-0 truncate text-[15px] font-black">{notice.title}</p>
								</div>
								<p class="m-0 mt-1 text-xs font-bold text-brand-muted">{formatDate(notice.publishedAt)}</p>
							</div>
							<ChevronRight class="shrink-0 text-brand-muted" size={18} />
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</main>
