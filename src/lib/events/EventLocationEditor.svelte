<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { CampusEventLocation } from '$lib/domain/event-locations';
	import EventMapPicker from './EventMapPicker.svelte';
	let { entry, clientId, ondirty = () => {} }: {
		entry: { key: string; title: string; locationName: string; latitude: number | null; longitude: number | null; location: CampusEventLocation | null; version: number; updatedAt: string; detailUrl: string; status: string };
		clientId: string; ondirty?: (dirty: boolean) => void;
	} = $props();
	let latitude = $state(untrack(() => entry.latitude ?? 36.6095));
	let longitude = $state(untrack(() => entry.longitude ?? 127.287));
	let location = $state<CampusEventLocation | null>(untrack(() => structuredClone(entry.location ?? (entry.latitude !== null && entry.longitude !== null ? { type: 'pin' as const } : null))));
	let locationName = $state(untrack(() => entry.locationName));
	let positionChosen = $state(untrack(() => entry.latitude !== null && entry.longitude !== null));
	let dirty = $state(false);
	let saving = $state(false);
	let message = $state('');
	let saved = $state(false);
	function markDirty() { dirty = true; saved = false; message = ''; ondirty(true); }
	beforeNavigate((navigation) => { if (dirty && !window.confirm('저장하지 않은 행사 위치를 나갈까요?')) navigation.cancel(); });
	const submit: SubmitFunction = () => {
		saving = true; message = '';
		return async ({ result, update }) => {
			try {
				if (result.type === 'success' || result.type === 'failure') {
					saved = result.type === 'success' && Boolean(result.data?.saved);
					message = String(result.data?.message ?? '저장 결과를 확인해 주세요.');
					if (saved) { dirty = false; ondirty(false); }
					await update({ reset: false });
				} else message = '저장 결과를 확인하지 못했습니다. 다시 시도해 주세요.';
			} finally { saving = false; }
		};
	};
</script>

<form method="POST" action="?/save" use:enhance={submit} oninput={markDirty}>
	<input type="hidden" name="entry" value={entry.key} />
	<input type="hidden" name="version" value={entry.version} />
	<input type="hidden" name="updatedAt" value={entry.updatedAt} />
	<input type="hidden" name="positionChosen" value={positionChosen} />
	<fieldset disabled={saving} class="m-0 min-w-0 border-0 p-0">
		<div class="border-b border-brand-border py-5">
			<p class="m-0 text-[12px] text-brand-muted">{entry.status}</p>
			<h2 class="m-0 mt-2 text-[16px] font-bold leading-6">{entry.title}</h2>
			<a class="inline-flex min-h-11 items-center text-[13px] text-brand-muted underline underline-offset-4" href={entry.detailUrl}>행사 정보 확인</a>
		</div>
		<label class="mt-5 grid gap-2 text-[13px] font-bold">장소명<input class="min-h-11 w-full min-w-0 border-b border-brand-border bg-transparent text-[13px] font-normal" name="locationName" bind:value={locationName} maxlength="160" placeholder="예: 미래관 사거리 앞" required /></label>
		<div class="mt-6"><EventMapPicker {clientId} bind:latitude bind:longitude bind:location bind:locationName {positionChosen} onchange={(chosen = true) => { positionChosen = chosen; markDirty(); }} /></div>
		<p class="my-4 text-[13px] leading-6 text-brand-muted" aria-live="polite">{positionChosen ? '선택한 위치를 저장하면 이 행사에 연결돼요.' : '지도를 눌러 핀을 찍거나 범위·건물을 선택해 주세요.'}</p>
	</fieldset>
	{#if message}<p role="status" class={`border-t border-brand-border py-4 text-[13px] leading-6 ${saved ? 'text-brand' : 'text-red-700'}`}>{message}</p>{/if}
	<div class="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
		<div class="mx-auto max-w-[680px]"><button class="min-h-12 w-full rounded-[10px] bg-brand text-[14px] font-bold text-white disabled:opacity-40" type="submit" disabled={saving || !positionChosen || !locationName.trim()}>{saving ? '저장 중…' : '행사 위치 저장'}</button></div>
	</div>
</form>
