<script lang="ts">
	import { ChevronLeft } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const publishedAt = $derived(
		data.notice.publishedAt
			? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(data.notice.publishedAt))
			: ''
	);
</script>

<svelte:head><title>{data.notice.title} | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<article class="min-h-dvh w-full bg-white md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:overflow-hidden md:rounded-[28px] md:border md:border-brand-border-strong">
		<header class="sticky top-0 z-10 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border bg-white px-2">
			<a class="grid h-11 w-11 place-items-center" href="/notices" aria-label="공지사항 목록으로 돌아가기"><ChevronLeft size={22} /></a>
			<h1 class="m-0 text-center text-lg font-black">공지사항</h1>
			<span></span>
		</header>
		<div class="px-5 pb-[calc(32px+env(safe-area-inset-bottom))] pt-5">
			<h2 class="m-0 text-xl font-black leading-snug">{data.notice.title}</h2>
			<p class="m-0 mt-2 border-b border-brand-border pb-4 text-xs font-bold text-brand-muted">{publishedAt}</p>
			<p class="m-0 whitespace-pre-wrap py-5 text-sm leading-7">{data.notice.content}</p>
		</div>
	</article>
</main>
