<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import type { CampusEventImageDto } from '$lib/server/campus-events';

	let { images, title }: { images: CampusEventImageDto[]; title: string } = $props();
	let currentIndex = $state(0);
	let scroller = $state<HTMLDivElement>();

	function moveTo(index: number) {
		currentIndex = Math.max(0, Math.min(images.length - 1, index));
		scroller?.children[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
	}

	function syncIndex() {
		if (!scroller?.clientWidth) return;
		currentIndex = Math.max(0, Math.min(images.length - 1, Math.round(scroller.scrollLeft / scroller.clientWidth)));
	}
</script>

<section class="relative bg-brand-map" aria-label="행사 이미지">
	{#if images.length > 0}
		<div bind:this={scroller} class="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none]" onscroll={syncIndex} role="region" aria-label={`${title} 이미지 갤러리`}>
			{#each images as image, index (image.id)}<img class="aspect-[4/3] w-full shrink-0 snap-start object-cover" src={image.url} alt={`${title} 이미지 ${index + 1}`} />{/each}
		</div>
		{#if images.length > 1}
			<button class="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-text shadow" type="button" aria-label="이전 이미지" onclick={() => moveTo(currentIndex - 1)} disabled={currentIndex === 0}><ChevronLeft size={18} /></button>
			<button class="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-text shadow" type="button" aria-label="다음 이미지" onclick={() => moveTo(currentIndex + 1)} disabled={currentIndex === images.length - 1}><ChevronRight size={18} /></button>
		{/if}
		<span class="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[12px] font-bold text-white">{currentIndex + 1} / {images.length}</span>
	{:else}
		<div class="grid aspect-[4/3] place-items-center"><img class="h-20 w-20 rounded-2xl object-cover opacity-70" src="/icon.png" alt="골라바유" /></div>
	{/if}
</section>
