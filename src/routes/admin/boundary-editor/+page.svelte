<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { ArrowLeft, Plus, RotateCcw, Save } from '@lucide/svelte';
	import type { CampusCoordinate } from '$lib/domain/campus-spots';
	import { addBoundaryPoint } from '$lib/map/boundary-editor';
	import type { ActionData, PageData } from './$types';

	type EditorMode = 'campus' | 'zone';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let editorMode = $state<EditorMode>('campus');
	let selectedCampusId = $state('');
	let campusBoundary = $state<CampusCoordinate[]>([]);
	let selectedZoneId = $state('');
	let isCreatingZone = $state(false);
	let zoneName = $state('');
	let zoneBoundary = $state<CampusCoordinate[]>([]);
	let mapElement: HTMLDivElement;
	let map: any;
	let polygon: any;
	let vertexMarkers: any[] = [];
	let loadError = $state('');

	const selectedCampusSpot = $derived(
		data.spots.find((spot) => spot.id === selectedCampusId) ?? null
	);
	const selectedZone = $derived(data.zones.find((zone) => zone.id === selectedZoneId) ?? null);
	const boundary = $derived(editorMode === 'campus' ? campusBoundary : zoneBoundary);
	let appliedServerState = '';

	$effect(() => {
		const serverState = JSON.stringify({
			mode: data.initialEditorMode,
			zoneId: data.initialZoneId,
			zoneIds: data.zones.map((zone) => zone.id),
			form
		});
		if (serverState === appliedServerState) return;

		const initialCampusSpot = data.spots[0] ?? null;
		const formStartsNewZone = form?.zoneOperation === 'create';
		const initialZoneId = form?.zoneId ?? data.initialZoneId;
		const initialZone = data.zones.find((zone) => zone.id === initialZoneId) ?? null;

		editorMode = form?.editorMode === 'zone' ? 'zone' : data.initialEditorMode;
		selectedCampusId = initialCampusSpot?.id ?? '';
		campusBoundary = initialCampusSpot?.boundary ?? [];
		selectedZoneId = formStartsNewZone ? '' : initialZoneId;
		isCreatingZone = formStartsNewZone || data.zones.length === 0;
		zoneName = form?.zoneName ?? initialZone?.name ?? '';
		zoneBoundary = form?.zoneBoundary
			? parseBoundaryDraft(form.zoneBoundary)
			: (initialZone?.boundary ?? []);
		appliedServerState = serverState;
	});

	onMount(() => {
		void initializeMap();
	});

	onDestroy(() => clearDrawing());

	function parseBoundaryDraft(value: string): CampusCoordinate[] {
		try {
			const parsed = JSON.parse(value);
			return Array.isArray(parsed) ? (parsed as CampusCoordinate[]) : [];
		} catch {
			return [];
		}
	}

	function switchEditorMode(mode: EditorMode) {
		editorMode = mode;
		if (mode === 'zone' && !isCreatingZone && !selectedZoneId && data.zones[0]) {
			chooseZone(data.zones[0].id);
			return;
		}
		renderDrawing(true);
	}

	function chooseCampusSpot(event: Event) {
		selectedCampusId = (event.currentTarget as HTMLSelectElement).value;
		campusBoundary =
			data.spots.find((spot) => spot.id === selectedCampusId)?.boundary ?? [];
		renderDrawing(true);
	}

	function chooseZone(id: string) {
		const zone = data.zones.find((item) => item.id === id);
		if (!zone) return;
		isCreatingZone = false;
		selectedZoneId = zone.id;
		zoneName = zone.name;
		zoneBoundary = zone.boundary;
		renderDrawing(true);
	}

	function startNewZone() {
		editorMode = 'zone';
		isCreatingZone = true;
		selectedZoneId = '';
		zoneName = '';
		zoneBoundary = [];
		renderDrawing(false);
	}

	function resetBoundary() {
		if (editorMode === 'campus') {
			campusBoundary = selectedCampusSpot?.boundary ?? [];
		} else if (isCreatingZone) {
			zoneName = '';
			zoneBoundary = [];
		} else {
			zoneName = selectedZone?.name ?? '';
			zoneBoundary = selectedZone?.boundary ?? [];
		}
		renderDrawing(true);
	}

	function updateBoundary(nextBoundary: CampusCoordinate[]) {
		if (editorMode === 'campus') campusBoundary = nextBoundary;
		else zoneBoundary = nextBoundary;
	}

	async function initializeMap() {
		if (!data.naverMapClientId) {
			loadError = '네이버 지도 Client ID가 설정되지 않았습니다.';
			return;
		}
		try {
			await loadNaverMapScript(data.naverMapClientId);
			const naver = window.naver as any;
			map = new naver.maps.Map(mapElement, {
				center: new naver.maps.LatLng(36.6095, 127.287),
				zoom: 16,
				minZoom: 13,
				maxZoom: 20,
				mapDataControl: false,
				scaleControl: false,
				zoomControl: true
			});
			naver.maps.Event.addListener(
				map,
				'click',
				(event: { coord: { lat: () => number; lng: () => number } }) => {
					updateBoundary(
						addBoundaryPoint(boundary, {
							latitude: event.coord.lat(),
							longitude: event.coord.lng()
						})
					);
					renderDrawing(false);
				}
			);
			renderDrawing(true);
		} catch {
			loadError = '네이버 지도를 불러오지 못했습니다.';
		}
	}

	function renderDrawing(shouldFocus: boolean) {
		if (!map || !window.naver) return;
		clearDrawing();
		const naver = window.naver as any;
		const paths = boundary.map(
			(point) => new naver.maps.LatLng(point.latitude, point.longitude)
		);
		if (paths.length >= 3) {
			polygon = new naver.maps.Polygon({
				map,
				paths,
				fillColor: '#a51c45',
				fillOpacity: 0.18,
				strokeColor: '#8a1538',
				strokeOpacity: 0.9,
				strokeWeight: 2
			});
		}
		vertexMarkers = boundary.map((point, index) => {
			const marker = new naver.maps.Marker({
				position: new naver.maps.LatLng(point.latitude, point.longitude),
				map,
				draggable: true,
				title: `${index + 1}번째 꼭짓점`
			});
			naver.maps.Event.addListener(
				marker,
				'dragend',
				(event: { coord: { lat: () => number; lng: () => number } }) => {
					updateBoundary(
						boundary.map((item, itemIndex) =>
							itemIndex === index
								? { latitude: event.coord.lat(), longitude: event.coord.lng() }
								: item
						)
					);
					renderDrawing(false);
				}
			);
			naver.maps.Event.addListener(marker, 'rightclick', () => {
				updateBoundary(boundary.filter((_, itemIndex) => itemIndex !== index));
				renderDrawing(false);
			});
			return marker;
		});

		const focusTarget = editorMode === 'campus' ? selectedCampusSpot?.center : selectedZone?.center;
		if (shouldFocus && focusTarget) {
			map.panTo(new naver.maps.LatLng(focusTarget.latitude, focusTarget.longitude));
		}
	}

	function clearDrawing() {
		polygon?.setMap(null);
		polygon = null;
		for (const marker of vertexMarkers) marker.setMap(null);
		vertexMarkers = [];
	}

	function loadNaverMapScript(clientId: string) {
		if (window.naver?.maps) return Promise.resolve();

		const existingScript = document.querySelector<HTMLScriptElement>(
			'script[data-naver-map-sdk]'
		);
		if (existingScript) return waitForNaverMap(existingScript);

		return new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
			script.async = true;
			script.defer = true;
			script.dataset.naverMapSdk = 'true';
			script.addEventListener('load', () => resolve(), { once: true });
			script.addEventListener('error', () => reject(), { once: true });
			document.head.appendChild(script);
		});
	}

	function waitForNaverMap(script: HTMLScriptElement) {
		return new Promise<void>((resolve, reject) => {
			const timeout = window.setTimeout(() => reject(new Error('Naver map SDK timeout')), 10000);
			const finish = (callback: () => void) => {
				window.clearTimeout(timeout);
				callback();
			};
			script.addEventListener('load', () => finish(resolve), { once: true });
			script.addEventListener('error', () => finish(reject), { once: true });
		});
	}
</script>

<svelte:head><title>지도 데이터 편집 | 골라바유</title></svelte:head>

<main class="min-h-screen bg-brand-bg p-4 text-brand-text md:p-6">
	<section class="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-[300px_1fr]">
		<aside class="grid content-start gap-4 rounded-[8px] border border-brand-border bg-white p-4">
			<a class="flex items-center gap-2 self-start text-sm font-black text-brand" href="/">
				<ArrowLeft size={18} strokeWidth={2.8} />
				나가기
			</a>

			<div>
				<p class="m-0 text-xs font-black text-brand-muted">관리자</p>
				<h1 class="m-0 mt-1 text-xl font-black">지도 데이터 편집</h1>
			</div>

			<div class="grid grid-cols-2 gap-2 rounded-[8px] bg-brand-bg p-1">
				<button
					class={editorMode === 'campus'
						? 'rounded-[6px] bg-white px-3 py-2 text-sm font-black text-brand shadow-sm'
						: 'rounded-[6px] px-3 py-2 text-sm font-bold text-brand-muted'}
					type="button"
					onclick={() => switchEditorMode('campus')}>캠퍼스 장소</button
				>
				<button
					class={editorMode === 'zone'
						? 'rounded-[6px] bg-white px-3 py-2 text-sm font-black text-brand shadow-sm'
						: 'rounded-[6px] px-3 py-2 text-sm font-bold text-brand-muted'}
					type="button"
					onclick={() => switchEditorMode('zone')}>상권 구역</button
				>
			</div>

			{#if editorMode === 'campus'}
				<label class="grid gap-2 text-sm font-bold">
					캠퍼스 장소
					<select
						class="rounded-[8px] border border-brand-border px-3 py-2.5"
						value={selectedCampusId}
						onchange={chooseCampusSpot}
					>
						{#each data.spots as spot}<option value={spot.id}>{spot.name}</option>{/each}
					</select>
				</label>
			{:else}
				<div class="grid gap-2">
					<div class="flex items-center justify-between gap-2">
						<p class="m-0 text-sm font-black">기존 구역 {data.zones.length}개</p>
						<button
							class="flex items-center gap-1 rounded-[8px] bg-brand px-2.5 py-2 text-xs font-black text-white"
							type="button"
							onclick={startNewZone}
						>
							<Plus size={14} />새 구역
						</button>
					</div>
					<div class="grid max-h-40 gap-1 overflow-y-auto rounded-[8px] border border-brand-border p-1">
						{#each data.zones as zone}
							<button
								class={selectedZoneId === zone.id && !isCreatingZone
									? 'rounded-[6px] bg-brand-bg px-3 py-2 text-left text-sm font-black text-brand'
									: 'rounded-[6px] px-3 py-2 text-left text-sm font-bold hover:bg-brand-bg'}
								type="button"
								onclick={() => chooseZone(zone.id)}>{zone.name}</button
							>
						{:else}
							<p class="m-0 px-3 py-4 text-center text-sm font-bold text-brand-muted">
								아직 저장된 구역이 없습니다.
							</p>
						{/each}
					</div>
				</div>

				<label class="grid gap-2 text-sm font-bold">
					{isCreatingZone ? '새 구역 이름' : '구역 이름'}
					<input
						class="rounded-[8px] border border-brand-border px-3 py-2.5"
						name="zone-name"
						maxlength="80"
						placeholder="예: 고대앞"
						bind:value={zoneName}
					/>
				</label>
			{/if}

			<p class="m-0 text-sm font-bold leading-6 text-brand-muted">
				지도를 눌러 꼭짓점을 추가하고, 점을 드래그해 조정하세요. 점을 오른쪽 클릭하면 삭제합니다.
			</p>
			<p class="m-0 text-sm font-black text-brand">꼭짓점 {boundary.length}개</p>

			<button
				class="flex items-center justify-center gap-2 rounded-[8px] border border-brand-border px-3 py-2.5 text-sm font-black"
				type="button"
				onclick={resetBoundary}
			>
				<RotateCcw size={16} />{editorMode === 'zone' && isCreatingZone
					? '입력 지우기'
					: '저장된 경계로 되돌리기'}
			</button>

			{#if editorMode === 'campus'}
				<form method="POST" action="?/saveCampusSpot" class="grid gap-2">
					<input type="hidden" name="id" value={selectedCampusId} />
					<input type="hidden" name="boundary" value={JSON.stringify(campusBoundary)} />
					<button
						class="flex items-center justify-center gap-2 rounded-[8px] bg-brand px-3 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
						type="submit"
						disabled={campusBoundary.length < 3}
					>
						<Save size={16} />변경 저장
					</button>
				</form>
				{#if form?.saveError}<p class="m-0 text-sm font-bold text-red-700">{form.saveError}</p>{/if}
				{#if form?.saved}
					<p class="m-0 text-sm font-bold text-emerald-700">
						저장했고, 공개 지도 캐시도 갱신했습니다.
					</p>
				{/if}
			{:else}
				<form
					method="POST"
					action={isCreatingZone ? '?/createZone' : '?/updateZone'}
					class="grid gap-2"
				>
					{#if !isCreatingZone}<input type="hidden" name="id" value={selectedZoneId} />{/if}
					<input type="hidden" name="name" value={zoneName} />
					<input type="hidden" name="boundary" value={JSON.stringify(zoneBoundary)} />
					<button
						class="flex items-center justify-center gap-2 rounded-[8px] bg-brand px-3 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
						type="submit"
						disabled={!zoneName.trim() || zoneBoundary.length < 3}
					>
						<Save size={16} />{isCreatingZone ? '새 구역 저장' : '구역 변경 저장'}
					</button>
				</form>
				{#if form?.zoneError}<p class="m-0 text-sm font-bold text-red-700">{form.zoneError}</p>{/if}
				{#if data.zoneSaved}
					<p class="m-0 text-sm font-bold text-emerald-700">구역을 저장했습니다.</p>
				{/if}
			{/if}
		</aside>

		<section
			class="relative h-[65dvh] min-h-[480px] overflow-hidden rounded-[8px] border border-brand-border bg-white md:h-[calc(100dvh-3rem)]"
		>
			<div class="absolute inset-0"><div bind:this={mapElement} class="h-full w-full"></div></div>
			{#if loadError}
				<p class="absolute inset-0 grid place-items-center p-6 text-center text-sm font-bold text-brand-muted">
					{loadError}
				</p>
			{/if}
		</section>
	</section>
</main>
