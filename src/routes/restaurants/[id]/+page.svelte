<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import RestaurantDetailView from '$lib/restaurant/RestaurantDetail.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	function backToMap() {
		if (page.state.fromOutsideMap) window.history.back();
		else void goto(`/?outside=${encodeURIComponent(data.restaurant.place.zoneId ?? 'all')}`);
	}
</script>

<svelte:head><title>{data.restaurant.place.name} · 골라바유</title></svelte:head>
<RestaurantDetailView restaurant={data.restaurant} isAuthenticated={data.isAuthenticated} onBack={backToMap} />
