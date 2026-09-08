<script lang="ts">
	import { getContext, onDestroy, type ComponentProps } from 'svelte';
	import NaverMap from './NaverMap.svelte';
	import { HOME_MAP_SESSION, type HomeMapSession } from './home-map-session.svelte';

	let props: ComponentProps<typeof NaverMap> = $props();
	let host = $state<HTMLDivElement>();
	const session = getContext<HomeMapSession | undefined>(HOME_MAP_SESSION);
	let previousFocusRequest = -1;

	$effect(() => {
		if (!session || !host) return;
		const request = props.focusRequestId ?? 0;
		if (request !== previousFocusRequest) {
			// 새 홈의 기본값 0은 기존 지도 확대 수준을 초기화하는 요청이 아니다.
			if (!session.hasAttached || request > 0) session.focusEpoch += 1;
			previousFocusRequest = request;
		}
		session.props = { ...props, focusRequestId: session.focusEpoch };
		session.host = host;
		session.hasAttached = true;
	});

	onDestroy(() => {
		if (session && session.host === host) session.host = null;
	});
</script>

{#if session}
	<div bind:this={host} class="absolute inset-0" data-home-map-slot></div>
{:else}
	<NaverMap {...props} />
{/if}
