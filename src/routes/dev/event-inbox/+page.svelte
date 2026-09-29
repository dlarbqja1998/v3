<script lang="ts">
	import EventInbox from '$lib/events/EventInbox.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>
<EventInbox {data} preview />
