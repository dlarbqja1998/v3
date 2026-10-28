<script lang="ts">
	import { onMount, untrack, type Snippet } from 'svelte';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { clampBottomSheetHeight, getFullscreenSheetHeights, getNextBottomSheetDetent, resolveBottomSheetDetent, type BottomSheetDetent, type BottomSheetHeights } from '$lib/domain/bottom-sheet';

	let { open, title, children, onBack, onClose, onHeightChange = () => {}, onExpandedChange = () => {} }: {
		open: boolean;
		title: string;
		children: Snippet;
		onBack: () => void;
		onClose: () => void;
		onHeightChange?: (height: number) => void;
		onExpandedChange?: (expanded: boolean) => void;
	} = $props();
	let sheet: HTMLElement;
	let handle: HTMLButtonElement;
	let detent = $state<BottomSheetDetent>('medium');
	let dragging = $state(false);
	let heights: BottomSheetHeights = { collapsed: 112, medium: 480, expanded: 800 };
	let height = 480;
	let pointer: number | null = null;
	let startY = 0;
	let startHeight = 0;
	let lastY = 0;
	let lastTime = 0;
	let velocity = 0;
	let moved = false;
	let frame = 0;
	let returnFocus: HTMLElement | null = null;
	const expanded = $derived(detent === 'expanded' && !dragging);

	function measure() {
		const available = sheet?.parentElement?.clientHeight ?? window.innerHeight;
		heights = getFullscreenSheetHeights(available);
		settle(detent);
	}

	function paint() {
		frame = 0;
		sheet?.style.setProperty('--sheet-height', `${height}px`);
	}
	function settle(next: BottomSheetDetent) {
		detent = next;
		height = heights[next];
		paint();
		onHeightChange(open ? height : 0);
		onExpandedChange(open && next === 'expanded');
	}

	$effect(() => {
		if (!open) {
			onHeightChange(0);
			onExpandedChange(false);
			return;
		}
		returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		untrack(() => { detent = 'medium'; measure(); });
		sheet?.focus({ preventScroll: true });
		return () => { returnFocus?.focus({ preventScroll: true }); };
	});

	onMount(() => {
		measure();
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
		if (sheet.parentElement) observer?.observe(sheet.parentElement);
		window.addEventListener('resize', measure);
		return () => { observer?.disconnect(); window.removeEventListener('resize', measure); cancelAnimationFrame(frame); };
	});

	function down(event: PointerEvent) {
		if (event.button !== 0) return;
		pointer = event.pointerId;
		startY = lastY = event.clientY;
		startHeight = height;
		lastTime = event.timeStamp;
		velocity = 0;
		moved = false;
		dragging = true;
		onExpandedChange(false);
		handle.setPointerCapture(pointer);
	}
	function move(event: PointerEvent) {
		if (event.pointerId !== pointer) return;
		const delta = event.clientY - startY;
		if (Math.abs(delta) > 4) moved = true;
		velocity = (event.clientY - lastY) / Math.max(1, event.timeStamp - lastTime);
		lastY = event.clientY;
		lastTime = event.timeStamp;
		height = clampBottomSheetHeight(startHeight - delta, heights);
		// 드래그 중에는 지도·콘텐츠 상태를 갱신하지 않고 시트 높이만 프레임당 한 번 그린다.
		if (!frame) frame = requestAnimationFrame(paint);
	}
	function up(event: PointerEvent, cancelled = false) {
		if (event.pointerId !== pointer) return;
		pointer = null;
		if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
		cancelAnimationFrame(frame); frame = 0;
		dragging = false;
		settle(cancelled ? detent : resolveBottomSheetDetent(height, event.timeStamp - lastTime > 100 ? 0 : velocity, detent, heights));
	}
	function keydown(event: KeyboardEvent) {
		if (event.defaultPrevented) return;
		if (event.target instanceof HTMLElement && event.target.closest('[role="dialog"]') && event.target.closest('[role="dialog"]') !== sheet) return;
		if (expanded && event.key === 'Tab') {
			const controls = [...sheet.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]')].filter(element => !element.closest('[hidden], [inert]') && !element.hasAttribute('disabled') && element.getClientRects().length);
			const first = controls[0]; const last = controls.at(-1);
			if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
			else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
		}
		if (event.key === 'Escape') { event.preventDefault(); onBack(); }
		if (event.target !== handle) return;
		if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
			event.preventDefault();
			settle(event.key === 'Home' ? 'collapsed' : event.key === 'End' ? 'expanded' : getNextBottomSheetDetent(detent, event.key === 'ArrowUp' ? 'up' : 'down'));
		}
	}
</script>

<section bind:this={sheet} class="lifestyle-sheet" class:expanded class:dragging hidden={!open} inert={!open} aria-label={`${title} 시트`} aria-modal={expanded ? 'true' : undefined} onkeydown={keydown} role={expanded ? 'dialog' : 'region'} tabindex="-1" data-lifestyle-sheet data-detent={detent}>
	<div class="sheet-chrome">
		<button bind:this={handle} type="button" class="sheet-handle" role="slider" aria-label={`${title} 시트 높이 조절`} aria-valuemin="1" aria-valuemax="3" aria-valuenow={detent === 'collapsed' ? 1 : detent === 'medium' ? 2 : 3} aria-valuetext={detent === 'expanded' ? '전체 화면' : detent === 'medium' ? '중간 높이' : '접힌 상태'} onpointerdown={down} onpointermove={move} onpointerup={(event) => up(event)} onpointercancel={(event) => up(event, true)} onclick={() => { if (!moved) settle(detent === 'expanded' ? 'medium' : 'expanded'); moved = false; }}><span></span></button>
		<header>
			<button type="button" class="sheet-action" aria-label="이전 화면으로" onclick={onBack}><AppIcon name="chevron" size={24} /></button>
			<h1>{title}</h1>
			<button type="button" class="sheet-action" aria-label={`${title} 닫기`} onclick={onClose}><AppIcon name="clear" size={24} /></button>
		</header>
	</div>
	<div class="sheet-body">{@render children()}</div>
</section>

<style>
	.lifestyle-sheet { --sheet-height: 62%; outline: none; position: absolute; inset: auto 0 0; z-index: 40; display: flex; flex-direction: column; height: var(--sheet-height); max-height: 100%; overflow: hidden; border-radius: 26px 26px 0 0; background: white; color: #19181a; box-shadow: 0 -6px 24px #2413180d; transition: height 280ms cubic-bezier(.2,.8,.2,1), border-radius 200ms; }
	.lifestyle-sheet[hidden] { display: none; }
	.lifestyle-sheet.expanded { border-radius: 0; }
	.lifestyle-sheet.dragging { transition: none; user-select: none; }
	.sheet-chrome { flex-shrink: 0; border-bottom: 1px solid var(--color-brand-border, #f0efec); }
	.expanded .sheet-chrome { padding-top: env(safe-area-inset-top); }
	.sheet-handle { display: flex; align-items: center; justify-content: center; width: 100%; height: 28px; padding: 0; border: 0; background: transparent; cursor: grab; touch-action: none; }
	.sheet-handle span { width: 36px; height: 4px; border-radius: 4px; background: #d5d1d3; }
	.sheet-handle:focus-visible { outline: 2px solid #8a1538; outline-offset: -3px; }
	header { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; height: 48px; padding-inline: 12px; }
	h1 { margin: 0; text-align: center; font-size: 18px; font-weight: 700; }
	.sheet-action { display: grid; place-items: center; width: 44px; height: 44px; background: transparent; border: 0; }
	.sheet-body { flex: 1; min-height: 0; position: relative; overflow: hidden; padding-bottom: env(safe-area-inset-bottom); }
	@media (prefers-reduced-motion: reduce) { .lifestyle-sheet { transition: none; } }
</style>
