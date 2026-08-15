<script lang="ts">
	import { fly } from 'svelte/transition';
	import AppIcon from '$lib/icon/AppIcon.svelte';
</script>

<div
	class="absolute inset-x-4 bottom-[calc(100%+12px)] flex items-center gap-2.5 rounded-[16px] border border-brand/25 bg-white px-4 py-3 text-brand shadow-[0_12px_30px_rgba(72,12,31,0.16)]"
	role="status"
	aria-live="polite"
	transition:fly={{ y: 8, duration: 160 }}
>
	<AppIcon name="my" size={24} />
	<p class="m-0 text-sm font-black">로그인이 필요합니다.</p>
</div>
