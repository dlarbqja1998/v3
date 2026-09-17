<script lang="ts">
	import AppIcon from '$lib/icon/AppIcon.svelte';
	let { title, expanded, controls, onToggle, meta = '' }: {
		title: string;
		expanded: boolean;
		controls: string;
		onToggle: () => void;
		meta?: string;
	} = $props();
</script>

<div class="flex min-h-11 items-center justify-between gap-3">
	<h2 class="gb1-section-title">
		<button type="button" class="flex min-h-11 items-center gap-2 text-left" aria-label={`${title} ${expanded ? '접기' : '펼치기'}`} aria-expanded={expanded} aria-controls={controls} onclick={onToggle}>
			<span>{title}</span>
			<AppIcon name="chevron" size={20} class={`text-brand-muted ${expanded ? 'rotate-90' : '-rotate-90'}`} />
		</button>
	</h2>
	{#if meta}<span class="shrink-0 text-[12px] text-brand-muted">{meta}</span>{/if}
</div>
