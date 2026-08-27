<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { getInquiryCategoryLabel } from '$lib/domain/support-inquiries';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>
<svelte:head><title>문의 관리 | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6"><section class="min-h-dvh w-full bg-white md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong">
	<header class="grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border px-2"><a class="grid h-11 w-11 place-items-center" href="/my" aria-label="마이페이지로 돌아가기"><ChevronLeft size={22} /></a><h1 class="m-0 text-center text-lg font-black">문의 관리</h1><span></span></header>
	<div class="px-5 pb-10 pt-5"><p class="m-0 border-b border-brand-border pb-3 text-sm font-bold text-brand-muted">답변 대기 문의가 먼저 표시됩니다.</p>{#each data.inquiries as inquiry}<a class="flex min-h-16 items-center justify-between gap-3 border-b border-brand-border py-3" href={`/admin/inquiries/${inquiry.id}`}><span class="min-w-0"><span class="text-xs font-bold text-brand-muted">{getInquiryCategoryLabel(inquiry.category)}</span><strong class="mt-1 block truncate text-sm">{inquiry.title}</strong></span><span class={`flex shrink-0 items-center gap-1 text-xs font-black ${inquiry.status === 'WAITING' ? 'text-brand' : 'text-brand-muted'}`}>{inquiry.status === 'WAITING' ? '답변 대기' : '답변 완료'}<ChevronRight size={16} /></span></a>{:else}<p class="m-0 py-12 text-center text-sm font-bold text-brand-muted">등록된 문의가 없습니다.</p>{/each}</div>
</section></main>
