<script lang="ts">
	import { onDestroy } from 'svelte';
	import NaverMap from './NaverMap.svelte';
	import type { HomeMapSession } from './home-map-session.svelte';

	let { session }: { session: HomeMapSession } = $props();
	let parking = $state<HTMLDivElement>();
	let container = $state<HTMLDivElement>();

	$effect(() => {
		const target = session.host ?? parking;
		if (target && container && container.parentElement !== target) target.appendChild(container);
	});

	onDestroy(() => container?.remove());
</script>

<!-- 지도를 다른 화면에서는 접근성과 레이아웃에서 제외하되 인스턴스와 DOM은 보관한다. -->
<div bind:this={parking} hidden inert aria-hidden="true">
	{#if session.props}
		<div bind:this={container} class="absolute inset-0" data-persistent-home-map>
			<NaverMap {...session.props} active={Boolean(session.host)} />
		</div>
	{/if}
</div>
