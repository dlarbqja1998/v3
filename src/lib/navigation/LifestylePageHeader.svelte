<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft, X } from '@lucide/svelte';

	let {
		title,
		closeLabel,
		variant = 'default',
		backIconSrc,
		closeIconSrc
	}: {
		title: string;
		closeLabel: string;
		variant?: 'default' | 'figma';
		backIconSrc?: string;
		closeIconSrc?: string;
	} = $props();

	function goBack() {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}
		void goto('/');
	}
</script>

<header class={variant === 'figma' ? 'figma-page-header sticky top-0 z-20' : 'sticky top-0 z-20 grid h-[calc(56px+env(safe-area-inset-top))] grid-cols-[44px_1fr_44px] items-end border-b border-brand-border bg-white px-3 pb-1 pt-[env(safe-area-inset-top)]'} data-lifestyle-page-header>
	<button class="grid h-11 w-11 place-items-center text-brand-text outline-none focus-visible:ring-2 focus-visible:ring-brand/25" type="button" aria-label="뒤로 가기" onclick={goBack}>
		{#if backIconSrc}<span class="figma-page-icon" style:mask-image={'url("' + backIconSrc + '")'} aria-hidden="true"></span>{:else}<ArrowLeft size={20} />{/if}
	</button>
	<h1 class={variant === 'figma' ? 'figma-page-title' : 'm-0 self-center truncate text-center text-lg font-black tracking-[-0.01em]'}>{title}</h1>
	<button class="grid h-11 w-11 place-items-center text-brand-text outline-none focus-visible:ring-2 focus-visible:ring-brand/25" type="button" aria-label={closeLabel} onclick={() => goto('/')}>
		{#if closeIconSrc}<span class="figma-page-icon" style:mask-image={'url("' + closeIconSrc + '")'} aria-hidden="true"></span>{:else}<X size={20} />{/if}
	</button>
</header>

<style>
	.figma-page-header { display: grid; grid-template-columns: 40px minmax(0, 1fr) 40px; grid-template-rows: minmax(0, 1fr); align-items: center; justify-items: center; height: calc(42px + env(safe-area-inset-top)); padding-top: env(safe-area-inset-top); background: white; }
	.figma-page-header button { color: #19181a; }
	.figma-page-title { margin: 0; color: #19181a; font-size: 18px; font-weight: 700; line-height: 1.2; letter-spacing: 0; text-align: center; }
	.figma-page-icon { display: block; width: 24px; height: 24px; background: currentColor; mask-position: center; mask-size: contain; mask-repeat: no-repeat; }
</style>
