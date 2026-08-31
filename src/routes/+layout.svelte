<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { syncBrowserAnalyticsUser, trackPageView } from '$lib/analytics/posthog.client';

	let { children, data } = $props();

	$effect(() => {
		syncBrowserAnalyticsUser(data.user);
	});

	afterNavigate(({ to }) => {
		if (to?.url) trackPageView(to.url);
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icon.png" />
</svelte:head>

{@render children()}
