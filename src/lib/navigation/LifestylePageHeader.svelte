<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, X } from '@lucide/svelte';

	let { title, closeLabel }: { title: string; closeLabel: string } = $props();

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}
		void goto('/');
	}
</script>

<header class="sticky top-0 z-20 grid h-[calc(56px+env(safe-area-inset-top))] grid-cols-[44px_1fr_44px] items-end border-b border-brand-border bg-white px-3 pb-1 pt-[env(safe-area-inset-top)]" data-lifestyle-page-header>
	<button class="grid h-11 w-11 place-items-center text-brand-text outline-none focus-visible:ring-2 focus-visible:ring-brand/25" type="button" aria-label="뒤로 가기" onclick={goBack}><ArrowLeft size={20} /></button>
	<h1 class="m-0 self-center truncate text-center text-lg font-black tracking-[-0.01em]">{title}</h1>
	<button class="grid h-11 w-11 place-items-center text-brand-text outline-none focus-visible:ring-2 focus-visible:ring-brand/25" type="button" aria-label={closeLabel} onclick={() => goto('/')}><X size={20} /></button>
</header>
