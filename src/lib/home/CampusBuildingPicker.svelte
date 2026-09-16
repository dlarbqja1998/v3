<script lang="ts">
	import { tick } from 'svelte';
	import AppIcon from '$lib/icon/AppIcon.svelte';

	let { value, buildings, totalCount, onChange }: {
		value: string;
		buildings: Array<{ name: string; count: number }>;
		totalCount: number;
		onChange: (building: string) => void;
	} = $props();

	const pickerId = $props.id();
	let dialog: HTMLDialogElement;
	let trigger: HTMLButtonElement;
	let searchInput: HTMLInputElement;
	let search = $state('');
	let open = $state(false);
	const options = $derived([
		{ value: '', name: '캠퍼스 전체', count: totalCount },
		...buildings.map((building) => ({ ...building, value: building.name }))
	].filter((option) => option.name.toLocaleLowerCase('ko').replace(/\s+/g, '').includes(search.toLocaleLowerCase('ko').replace(/\s+/g, ''))));

	async function openPicker() {
		search = '';
		open = true;
		await tick();
		// 구형 WebView에서도 닫기·선택 동작을 사용할 수 있게 일반 대화상자로 대체한다.
		if (typeof dialog.showModal === 'function') dialog.showModal();
		else dialog.open = true;
		const selected = dialog.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
		selected?.focus({ preventScroll: true });
		selected?.scrollIntoView({ block: 'nearest' });
	}

	function closePicker() {
		if (typeof dialog.close === 'function') dialog.close();
		else dialog.open = false;
		open = false;
		trigger?.focus({ preventScroll: true });
	}

	function selectBuilding(building: string) {
		if (building !== value) onChange(building);
		closePicker();
	}

	function handleKeydown(event: KeyboardEvent) {
		// 바깥 시설 패널의 Escape 동작까지 함께 실행되지 않게 한다.
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			closePicker();
			return;
		}
		if (event.target instanceof HTMLInputElement) return;
		const buttons = [...dialog.querySelectorAll<HTMLButtonElement>('[data-building-option]')];
		const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
		if (index < 0) return;
		let next: number | undefined;
		if (event.key === 'ArrowDown') next = (index + 1) % buttons.length;
		if (event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
		if (event.key === 'Home') next = 0;
		if (event.key === 'End') next = buttons.length - 1;
		if (next !== undefined) {
			event.preventDefault();
			buttons[next]?.focus();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target !== dialog) return;
		const bounds = dialog.getBoundingClientRect();
		if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closePicker();
	}
</script>

<button
	bind:this={trigger}
	type="button"
	class="group flex min-h-11 min-w-0 items-center gap-2 rounded-xl py-1 pr-2 text-left outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/25"
	aria-label={`건물 선택: ${value || '캠퍼스 전체'}`}
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-controls={pickerId}
	onclick={openPicker}
>
	<span class="truncate text-[16px] font-bold">{value || '캠퍼스 전체'}</span>
	<span class={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors ${open ? 'bg-brand/10 text-brand' : 'bg-brand-bg text-brand-muted group-hover:bg-brand/10 group-hover:text-brand'}`}>
		<AppIcon name="chevron" size={20} class={`transition-transform duration-200 ${open ? 'rotate-90' : '-rotate-90'}`} />
	</span>
</button>

<dialog
	bind:this={dialog}
	id={pickerId}
	class="building-picker text-brand-text"
	aria-labelledby={`${pickerId}-title`}
	onkeydown={handleKeydown}
	onclick={handleBackdropClick}
	oncancel={(event) => { event.preventDefault(); closePicker(); }}
	onclose={() => { open = false; }}
>
	<div class="picker-content flex min-h-0 flex-1 flex-col">
		<div class="mx-auto mt-3 mb-1 h-1 w-9 shrink-0 rounded-full bg-brand-border" aria-hidden="true"></div>
		<header class="relative mx-5 flex min-h-14 shrink-0 items-center justify-center">
			<h2 id={`${pickerId}-title`} class="m-0 text-center text-[18px] font-bold">건물 선택</h2>
			<button type="button" class="absolute right-0 min-h-11 px-1 text-[13px] text-brand-muted" onclick={closePicker}>닫기</button>
		</header>
		<div class="mx-5 mb-3 flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-bg px-3 focus-within:ring-1 focus-within:ring-brand/25">
			<AppIcon name="search" size={20} class="text-brand-muted" />
			<input bind:this={searchInput} bind:value={search} class="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-brand-muted/70" type="search" aria-label="건물명 검색" placeholder="건물명 검색" autocomplete="off" />
			{#if search}<button type="button" class="grid h-10 w-8 shrink-0 place-items-center text-brand-muted" aria-label="건물 검색어 지우기" onclick={() => { search = ''; searchInput.focus(); }}><AppIcon name="clear" size={20} /></button>{/if}
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="건물 목록">
			{#each options as option (option.value)}
				<button type="button" data-building-option aria-pressed={value === option.value}
					class={`flex min-h-14 w-full items-center gap-3 border-b border-brand-border px-2 text-left outline-none transition-colors focus-visible:bg-brand/5 ${value === option.value ? 'bg-brand/[0.04] text-brand' : 'text-brand-text hover:bg-brand-bg'}`}
					onclick={() => selectBuilding(option.value)}>
					<span class={`min-w-0 flex-1 text-[15px] ${value === option.value ? 'font-bold' : 'font-medium'}`}>{option.name}</span>
					<span class="shrink-0 text-[12px] tabular-nums text-brand-muted">{option.count}개 시설</span>
					<span aria-hidden="true" class={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${value === option.value ? 'border-brand' : 'border-brand-border'}`}>
						{#if value === option.value}<span class="h-2 w-2 rounded-full bg-brand"></span>{/if}
					</span>
				</button>
			{:else}
				<div class="py-10 text-center" role="status"><p class="m-0 text-[15px] font-bold">일치하는 건물이 없어요</p><p class="m-0 mt-2 text-[13px] text-brand-muted">건물 이름을 다시 확인해 주세요.</p></div>
			{/each}
		</div>
	</div>
</dialog>

<style>
	.building-picker {
		position: fixed;
		inset: auto 0 0;
		width: min(100%, 430px);
		max-width: 100%;
		height: min(620px, 78vh);
		height: min(620px, 78dvh);
		max-height: calc(100% - 24px);
		margin: 0 auto;
		padding: 0 0 max(12px, env(safe-area-inset-bottom));
		border: 0;
		border-radius: 24px 24px 0 0;
		background: white;
		box-shadow: 0 -8px 40px rgb(30 20 24 / 10%);
		overflow: hidden;
	}
	.building-picker[open] { display: flex; }
	.building-picker::backdrop { background: rgb(30 20 24 / 28%); }
	.picker-content { max-height: 100%; }
	input::-webkit-search-cancel-button { display: none; }
	@media (prefers-reduced-motion: no-preference) {
		.building-picker[open] { animation: picker-enter 180ms ease-out; }
		.building-picker[open]::backdrop { animation: backdrop-enter 180ms ease-out; }
	}
	@keyframes picker-enter { from { opacity: 0; transform: translateY(16px); } }
	@keyframes backdrop-enter { from { opacity: 0; } }
</style>
