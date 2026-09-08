<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import { setContext } from 'svelte';
	import { HOME_MAP_SESSION, HomeMapSession } from '$lib/map/home-map-session.svelte';
	import PersistentHomeMap from '$lib/map/PersistentHomeMap.svelte';
	import { syncBrowserAnalyticsUser, trackPageView } from '$lib/analytics/posthog.client';

	let { children, data } = $props();
	const mapSession = setContext(HOME_MAP_SESSION, new HomeMapSession());

	$effect(() => {
		syncBrowserAnalyticsUser(data.user);
	});

	afterNavigate(({ to }) => {
		if (to?.url) trackPageView(to.url);
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href="/icon.png" />
	<link rel="apple-touch-icon" href="/icon.png" />
	<meta name="apple-mobile-web-app-title" content="골라바유" />
</svelte:head>

{@render children()}
<PersistentHomeMap session={mapSession} />
