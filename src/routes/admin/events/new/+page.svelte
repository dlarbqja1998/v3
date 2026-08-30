<script lang="ts">
	import EventEditor from '$lib/events/EventEditor.svelte';
	import type { ActionData, PageData } from './$types';
	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head><title>행사 등록 | 골라바유</title></svelte:head>
<EventEditor naverMapClientId={data.naverMapClientId} action="?/create" message={form?.message ?? ''} />
