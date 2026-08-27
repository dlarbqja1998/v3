<script lang="ts">
	import { ChevronLeft } from '@lucide/svelte';
	import { getInquiryCategoryLabel } from '$lib/domain/support-inquiries';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData | null } = $props();
</script>
<svelte:head><title>문의 답변 | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6"><section class="min-h-dvh w-full bg-white md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong">
	<header class="grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border px-2"><a class="grid h-11 w-11 place-items-center" href="/admin/inquiries" aria-label="문의 관리로 돌아가기"><ChevronLeft size={22} /></a><h1 class="m-0 text-center text-lg font-black">문의 답변</h1><span></span></header>
	<div class="px-5 pb-10 pt-6"><section class="border-b border-brand-border pb-6"><p class="m-0 text-xs font-bold text-brand-muted">{getInquiryCategoryLabel(data.inquiry.category)} · 사용자 #{data.inquiry.userId}</p><h2 class="m-0 mt-2 text-lg font-black">{data.inquiry.title}</h2><p class="m-0 mt-4 whitespace-pre-wrap text-sm leading-7">{data.inquiry.content}</p></section>
	<form method="POST" action="?/answer" class="grid gap-4 pt-6"><label class="grid gap-2 text-[15px] font-black">운영팀 답변<textarea class="min-h-48 resize-y border border-brand-border p-3 text-sm leading-6 outline-none focus:border-brand" name="answer" maxlength="2000" required>{data.inquiry.answer ?? ''}</textarea></label>{#if form?.message}<p class={`m-0 text-sm font-bold ${form.success ? 'text-emerald-600' : 'text-red-600'}`}>{form.message}</p>{/if}<button class="h-14 bg-brand text-sm font-black text-white" type="submit">{data.inquiry.answer ? '답변 수정' : '답변 저장'}</button></form></div>
</section></main>
