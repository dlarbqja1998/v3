<script lang="ts">
	import EventInbox from '$lib/events/EventInbox.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>
<EventInbox {data} {form} />
