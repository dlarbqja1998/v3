<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from '@lucide/svelte';
	import type { CampusEventImageDto } from '$lib/server/campus-events';

	let {
		existingImages = [],
		onchange = () => {}
	}: { existingImages?: CampusEventImageDto[]; onchange?: () => void } = $props();

	let orderedExistingIds = $state(untrack(() => existingImages.map((image) => image.id)));
	let removedImageIds = $state<string[]>([]);
	let newImages = $state<{ file: File; preview: string; index: number }[]>([]);
	let coverTarget = $state(untrack(() => existingImages.find((image) => image.isCover)?.id ?? ''));

	onDestroy(() => {
		for (const item of newImages) URL.revokeObjectURL(item.preview);
	});

	const visibleExisting = $derived(
		orderedExistingIds
			.filter((id) => !removedImageIds.includes(id))
			.map((id) => existingImages.find((image) => image.id === id))
			.filter((image): image is CampusEventImageDto => Boolean(image))
	);

	function chooseFiles(event: Event) {
		for (const item of newImages) URL.revokeObjectURL(item.preview);
		const files = [...((event.currentTarget as HTMLInputElement).files ?? [])].slice(0, 6);
		newImages = files.map((file, index) => ({ file, preview: URL.createObjectURL(file), index }));
		if (!coverTarget && newImages.length > 0) coverTarget = 'new:0';
		onchange();
	}

	function removeExisting(id: string) {
		removedImageIds = [...removedImageIds, id];
		if (coverTarget === id) {
			coverTarget = visibleExisting.find((image) => image.id !== id)?.id ?? (newImages.length ? 'new:0' : '');
		}
		onchange();
	}

	function moveExisting(id: string, direction: -1 | 1) {
		const index = orderedExistingIds.indexOf(id);
		const target = index + direction;
		if (index < 0 || target < 0 || target >= orderedExistingIds.length) return;
		const next = [...orderedExistingIds];
		[next[index], next[target]] = [next[target], next[index]];
		orderedExistingIds = next;
		onchange();
	}
</script>

<section aria-labelledby="event-images-title">
	<div>
		<h2 id="event-images-title" class="m-0 text-[15px] font-black">행사 이미지</h2>
		<p class="m-0 mt-1 text-[13px] leading-5 text-brand-muted">대표 1장과 서브 최대 5장 · JPEG, PNG, WebP · 장당 10MB 이하</p>
	</div>
	<input type="hidden" name="orderedExistingIds" value={JSON.stringify(orderedExistingIds.filter((id) => !removedImageIds.includes(id)))} />
	<input type="hidden" name="removedImageIds" value={JSON.stringify(removedImageIds)} />
	<input type="hidden" name="coverTarget" value={coverTarget} />

	{#if visibleExisting.length > 0}
		<div class="mt-4 divide-y divide-brand-border border-y border-brand-border">
			{#each visibleExisting as image, index (image.id)}
				<div class="flex min-h-20 items-center gap-3 py-3">
					<img class="h-14 w-14 rounded-[10px] object-cover" src={image.url} alt="" />
					<label class="flex min-w-0 flex-1 items-center gap-2 text-[13px] font-bold"><input class="accent-brand" type="radio" name="coverChoice" checked={coverTarget === image.id} onchange={() => { coverTarget = image.id; onchange(); }} />대표 이미지</label>
					<div class="flex items-center">
						<button class="icon-button" type="button" aria-label="위로 이동" disabled={index === 0} onclick={() => moveExisting(image.id, -1)}><ArrowUp size={16} /></button>
						<button class="icon-button" type="button" aria-label="아래로 이동" disabled={index === visibleExisting.length - 1} onclick={() => moveExisting(image.id, 1)}><ArrowDown size={16} /></button>
						<button class="icon-button text-red-700" type="button" aria-label="이미지 삭제" onclick={() => removeExisting(image.id)}><Trash2 size={16} /></button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<label class="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-brand-border text-sm font-black text-brand">
		<ImagePlus size={18} />이미지 선택
		<input class="sr-only" name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onchange={chooseFiles} />
	</label>
	{#if newImages.length > 0}
		<div class="mt-3 grid grid-cols-3 gap-2">
			{#each newImages as item}
				<label class="relative overflow-hidden rounded-[10px] border border-brand-border">
					<img class="aspect-square w-full object-cover" src={item.preview} alt="신규 행사 이미지 미리보기" />
					<span class="flex min-h-9 items-center gap-1 bg-white px-2 text-[11px] font-bold"><input class="accent-brand" type="radio" name="coverChoice" checked={coverTarget === `new:${item.index}`} onchange={() => { coverTarget = `new:${item.index}`; onchange(); }} />대표</span>
				</label>
			{/each}
		</div>
		<p class="m-0 mt-2 text-[12px] text-brand-muted">신규 파일을 다시 고르려면 ‘이미지 선택’을 누르세요.</p>
	{/if}
</section>

<style>
	.icon-button { display:grid; width:36px; height:36px; place-items:center; color:var(--color-brand-muted); }
	.icon-button:disabled { opacity:.25; }
</style>
