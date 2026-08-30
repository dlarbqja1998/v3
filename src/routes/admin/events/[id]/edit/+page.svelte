<script lang="ts">
	import EventEditor from '$lib/events/EventEditor.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>{data.event.title} 수정 | 골라바유</title></svelte:head>
<EventEditor event={data.event} naverMapClientId={data.naverMapClientId} action="?/update" message={form?.message ?? ''} saved={data.saved} />
