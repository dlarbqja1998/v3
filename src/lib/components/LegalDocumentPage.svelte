<script lang="ts">
	import { ChevronLeft } from '@lucide/svelte';
	import type { LegalDocument } from '$lib/content/legal-documents';
	let { document }: { document: LegalDocument } = $props();
</script>
<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6"><section class="min-h-dvh w-full bg-white md:max-h-[calc(100vh-48px)] md:w-[min(100%,430px)] md:overflow-y-auto md:rounded-[28px] md:border md:border-brand-border-strong">
	<header class="sticky top-0 z-10 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border bg-white px-2"><button class="grid h-11 w-11 place-items-center" type="button" aria-label="이전 화면" onclick={() => history.back()}><ChevronLeft size={22} /></button><h1 class="m-0 text-center text-lg font-black">{document.title}</h1><span></span></header>
	<div class="px-5 pb-[calc(36px+env(safe-area-inset-bottom))] pt-5"><p class="m-0 text-sm font-bold text-brand-muted">버전 {document.version}</p><p class="m-0 mt-1 text-xs font-bold text-brand-muted">공고일 {document.announcedDate} · 시행일 {document.effectiveDate}</p>
		{#each document.sections as section}<section class="border-b border-brand-border py-5"><h2 class="m-0 text-[15px] font-black">{section.title}</h2>{#each section.paragraphs as paragraph}<p class="m-0 mt-3 whitespace-pre-wrap text-[13px] leading-6">{paragraph}</p>{/each}</section>{/each}
	</div>
</section></main>
