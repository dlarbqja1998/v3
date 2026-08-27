<script lang="ts">
	import { ChevronLeft, ChevronRight, Plus, X } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { inquiryCategories, getInquiryCategoryLabel } from '$lib/domain/support-inquiries';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	let composing = $state(false);
	const date = (value: string | Date) => new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(value));
</script>

<svelte:head><title>문의하기 | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section class="min-h-dvh w-full bg-white md:min-h-[min(900px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong">
		<header class="sticky top-0 z-10 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border bg-white px-2">
			<a class="grid h-11 w-11 place-items-center" href="/my" aria-label="마이페이지로 돌아가기"><ChevronLeft size={22} /></a><h1 class="m-0 text-center text-lg font-black">문의하기</h1><span></span>
		</header>
		<div class="px-5 pb-[calc(32px+env(safe-area-inset-bottom))] pt-5">
			<button class="flex h-12 w-full items-center justify-center gap-2 bg-brand text-sm font-black text-white" type="button" onclick={() => composing = !composing}>{#if composing}<X size={17} />문의 작성 닫기{:else}<Plus size={17} />새 문의 작성{/if}</button>
			{#if composing}
				<form method="POST" action="?/create" use:enhance={() => async ({ result, update }) => { await update(); if (result.type === 'success') composing = false; }} class="grid gap-4 border-b border-brand-border py-5">
					<label class="grid gap-2 text-sm font-black">문의 유형<select class="h-12 border-b border-brand-border-strong bg-white" name="category">{#each inquiryCategories as category}<option value={category.value}>{category.label}</option>{/each}</select></label>
					<label class="grid gap-2 text-sm font-black">제목<input class="h-12 border-b border-brand-border-strong px-1 outline-none focus:border-brand" name="title" maxlength="60" required /></label>
					<label class="grid gap-2 text-sm font-black">내용<textarea class="min-h-44 resize-y border border-brand-border p-3 text-sm leading-6 outline-none focus:border-brand" name="content" maxlength="2000" required></textarea></label>
					<p class="m-0 text-xs leading-5 text-brand-muted">답변이 등록되면 문의 목록에 새 답변으로 표시됩니다.</p>
					<button class="h-14 bg-brand text-sm font-black text-white" type="submit">문의 등록</button>
				</form>
			{/if}
			{#if form?.message}<p class={`m-0 border-b border-brand-border py-3 text-sm font-bold ${form.success ? 'text-emerald-600' : 'text-red-600'}`}>{form.message}</p>{/if}
			<section class="mt-6"><h2 class="m-0 border-b border-brand-border pb-3 text-[15px] font-black">내 문의</h2>
				{#each data.inquiries as inquiry}
					<a class="flex min-h-16 items-center justify-between gap-3 border-b border-brand-border py-3" href={`/my/inquiries/${inquiry.id}`}>
						<span class="min-w-0"><span class="block text-xs font-bold text-brand-muted">{getInquiryCategoryLabel(inquiry.category)} · {date(inquiry.createdAt)}</span><span class="mt-1 block truncate text-sm font-black">{inquiry.title}</span></span>
						<span class="flex shrink-0 items-center gap-2 text-xs font-black text-brand">{inquiry.answer && !inquiry.answerReadAt ? '새 답변' : inquiry.status === 'ANSWERED' ? '답변 완료' : '답변 대기'}<ChevronRight size={16} /></span>
					</a>
				{:else}<p class="m-0 py-12 text-center text-sm font-bold text-brand-muted">아직 등록한 문의가 없습니다.</p>{/each}
			</section>
		</div>
	</section>
</main>
