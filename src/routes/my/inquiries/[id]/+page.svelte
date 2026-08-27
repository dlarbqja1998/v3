<script lang="ts">
	import { ChevronLeft } from '@lucide/svelte';
	import { getInquiryCategoryLabel } from '$lib/domain/support-inquiries';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const date = (value: string | Date | null) => value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)) : '';
</script>
<svelte:head><title>{data.inquiry.title} | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6"><section class="min-h-dvh w-full bg-white md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong">
	<header class="grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border px-2"><a class="grid h-11 w-11 place-items-center" href="/my/inquiries" aria-label="문의 목록으로 돌아가기"><ChevronLeft size={22} /></a><h1 class="m-0 text-center text-lg font-black">문의 상세</h1><span></span></header>
	<div class="px-5 pb-10 pt-6"><section class="border-b border-brand-border pb-6"><p class="m-0 text-xs font-bold text-brand-muted">{getInquiryCategoryLabel(data.inquiry.category)} · {date(data.inquiry.createdAt)}</p><h2 class="m-0 mt-2 text-lg font-black">{data.inquiry.title}</h2><p class="m-0 mt-4 whitespace-pre-wrap text-sm leading-7">{data.inquiry.content}</p></section>
	<section class="pt-6"><h2 class="m-0 text-[15px] font-black">운영팀 답변</h2>{#if data.inquiry.answer}<p class="m-0 mt-4 whitespace-pre-wrap text-sm leading-7">{data.inquiry.answer}</p><p class="m-0 mt-4 text-xs font-bold text-brand-muted">{date(data.inquiry.answerUpdatedAt ?? data.inquiry.answeredAt)}</p>{:else}<p class="m-0 mt-4 text-sm leading-6 text-brand-muted">답변을 준비하고 있습니다.</p>{/if}</section></div>
</section></main>
