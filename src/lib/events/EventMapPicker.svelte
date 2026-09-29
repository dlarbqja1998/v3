<script lang="ts">
	import { onMount } from 'svelte';
	import type { CampusCoordinate, CampusSpot } from '$lib/domain/campus-spots';
	import { getCampusEventSpots, getEventAreaCenter, isValidEventBoundary, type CampusEventLocation } from '$lib/domain/event-locations';
	import { enableSecureNaverMapTiles, loadNaverMapSdkWithRetry } from '$lib/map/naver-map-sdk';

	let { clientId, latitude = $bindable(36.6095), longitude = $bindable(127.287),
		location = $bindable<CampusEventLocation | null>(null), locationName = $bindable(''), positionChosen = true, onchange = () => {}
	}: { clientId: string; latitude?: number; longitude?: number; location?: CampusEventLocation | null;
		locationName?: string; positionChosen?: boolean; onchange?: (chosen?: boolean) => void } = $props();

	const modes = [{ id: 'pin', label: '핀 찍기' }, { id: 'area', label: '범위 선택' }, { id: 'building', label: '건물 선택' }] as const;
	const mode = $derived(location?.type ?? 'pin');
	const boundary = $derived(location?.type === 'area' ? location.boundary : []);
	const buildingIds = $derived(location?.type === 'building' ? location.buildingIds : []);
	let spots = $state<CampusSpot[]>([]);
	let spotsError = $state('');
	let spotsLoading = $state(false);
	let buildingQuery = $state('');
	const buildings = $derived(spots.filter((spot) => spot.type === 'building'));
	const visibleBuildings = $derived(buildings.filter((spot) => spot.name.replace(/\s/g, '').includes(buildingQuery.replace(/\s/g, ''))));
	const linkedSpots = $derived(positionChosen ? getCampusEventSpots({ id: 'editor', latitude, longitude, location, locationName }, spots) : []);
	let mapElement: HTMLDivElement;
	let map: any;
	let mapReady = $state(false);
	let loadError = $state('');
	let destroyed = false;
	let lastAutoName = '';
	let pointLatitude = $state(36.6095);
	let pointLongitude = $state(127.287);

	onMount(() => {
		void loadSpots(); void initializeMap();
		return () => {
			destroyed = true;
			if (map) (window.naver?.maps.Event as any)?.clearInstanceListeners(map);
			map?.destroy?.();
		};
	});

	async function loadSpots() {
		spotsLoading = true; spotsError = '';
		try {
			const response = await fetch('/api/map/campus-spots');
			if (!response.ok) throw new Error();
			const payload = await response.json();
			if (!Array.isArray(payload.spots) || !payload.spots.length) throw new Error();
			if (!destroyed) spots = payload.spots;
		} catch { if (!destroyed) spotsError = '건물 목록을 불러오지 못했습니다.'; }
		finally { if (!destroyed) spotsLoading = false; }
	}

	async function initializeMap() {
		loadError = '';
		if (!clientId) { loadError = '지도를 사용할 수 없습니다. 건물 목록이나 좌표 입력으로 위치를 정해 주세요.'; return; }
		try {
			await loadNaverMapSdkWithRetry(clientId);
			if (destroyed) return;
			const maps = window.naver!.maps as any;
			map = new maps.Map(mapElement, { center: new maps.LatLng(latitude, longitude), zoom: 17, minZoom: 12, maxZoom: 21, mapDataControl: false, scaleControl: false, zoomControl: true });
			enableSecureNaverMapTiles(map);
			maps.Event.addListener(map, 'click', ({ coord }: any) => {
				if (mode === 'pin') setPosition(coord.lat(), coord.lng());
				else if (mode === 'area') addPoint({ latitude: coord.lat(), longitude: coord.lng() });
			});
			mapReady = true;
		} catch { if (!destroyed) loadError = '지도를 불러오지 못했습니다. 건물 목록이나 좌표 입력으로 위치를 정할 수 있습니다.'; }
	}

	function changeMode(next: typeof mode) {
		if (mode === next) return;
		location = next === 'building' ? { type: next, buildingIds: [] } : next === 'area' ? { type: next, boundary: [] } : { type: next };
		onchange(false);
	}
	function setPosition(lat: number, lng: number) {
		latitude = lat; longitude = lng; location = { type: 'pin' }; onchange();
	}
	function setBoundary(points: CampusCoordinate[]) {
		location = { type: 'area', boundary: points };
		if (points.length) ({ latitude, longitude } = getEventAreaCenter(points));
		onchange(isValidEventBoundary(points));
	}
	function addPoint(point: CampusCoordinate) {
		if (boundary.length >= 64 || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude) || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180) return;
		setBoundary([...boundary, point]);
	}
	function toggleBuilding(spot: CampusSpot) {
		const next = buildingIds.includes(spot.id) ? buildingIds.filter((id) => id !== spot.id) : [...buildingIds, spot.id];
		location = { type: 'building', buildingIds: next };
		const first = spots.find((item) => item.id === next[0]);
		if (first) {
			({ latitude, longitude } = first.center);
			if (mapReady) map.setCenter(new (window.naver!.maps as any).LatLng(latitude, longitude));
		}
		const name = next.map((id) => spots.find((item) => item.id === id)?.name).filter(Boolean).join(' · ');
		if (!locationName || locationName === lastAutoName) { locationName = name; lastAutoName = name; }
		onchange(next.length > 0);
	}

	$effect(() => {
		if (!mapReady) return;
		const maps = window.naver!.maps as any;
		const objects: any[] = [];
		const polygon = (points: CampusCoordinate[], selected: boolean, onclick?: () => void) => {
			const item = new maps.Polygon({ map, paths: points.map((p) => new maps.LatLng(p.latitude, p.longitude)), fillColor: '#a51c45', fillOpacity: selected ? 0.2 : 0.05, strokeColor: '#a51c45', strokeOpacity: selected ? 0.8 : 0.3, strokeWeight: selected ? 2 : 1, clickable: Boolean(onclick) });
			if (onclick) maps.Event.addListener(item, 'click', onclick);
			objects.push(item);
		};
		if (mode === 'building') {
			for (const spot of buildings) polygon(spot.boundary, buildingIds.includes(spot.id), () => toggleBuilding(spot));
		} else if (mode === 'area') {
			if (boundary.length >= 3) polygon(boundary, true);
			for (const [index, point] of boundary.entries()) {
				const marker = new maps.Marker({ map, position: new maps.LatLng(point.latitude, point.longitude), draggable: true, title: `범위 꼭짓점 ${index + 1}`, icon: { content: `<span style="display:grid;place-items:center;width:24px;height:24px;border:2px solid white;border-radius:50%;background:#a51c45;color:white;font-size:12px;font-weight:700">${index + 1}</span>`, anchor: new maps.Point(12, 12) } });
				maps.Event.addListener(marker, 'dragend', ({ coord }: any) => setBoundary(boundary.map((p, i) => i === index ? { latitude: coord.lat(), longitude: coord.lng() } : p)));
				objects.push(marker);
			}
		} else if (positionChosen) {
			const marker = new maps.Marker({ map, position: new maps.LatLng(latitude, longitude), draggable: true, icon: { url: '/images/map/event-pin.svg', size: new maps.Size(46, 46), scaledSize: new maps.Size(46, 46), anchor: new maps.Point(23, 43) } });
			maps.Event.addListener(marker, 'dragend', ({ coord }: any) => setPosition(coord.lat(), coord.lng()));
			objects.push(marker);
		}
		return () => { for (const item of objects) { maps.Event.clearInstanceListeners(item); item.setMap(null); } };
	});
</script>

<section class="grid gap-3" aria-labelledby="event-location-title">
	<h2 id="event-location-title" class="m-0 text-[18px] font-bold">행사 위치</h2>
	<div class="relative grid grid-cols-3 border-b border-brand-border" aria-label="위치 지정 방식">
		{#each modes as option}<button type="button" class={`min-h-12 text-[13px] ${mode === option.id ? 'font-bold text-brand' : 'text-brand-muted'}`} aria-pressed={mode === option.id} onclick={() => changeMode(option.id)}>{option.label}</button>{/each}
		<span class="absolute bottom-0 left-0 h-0.5 w-1/3 bg-brand transition-transform duration-200 motion-reduce:transition-none" style={`transform:translateX(${modes.findIndex((item) => item.id === mode) * 100}%)`}></span>
	</div>
	<p class="m-0 text-[13px] leading-5 text-brand-muted">{mode === 'pin' ? '지도를 누르거나 핀을 옮겨 주세요. 건물 안에 찍으면 해당 건물에도 행사가 표시됩니다.' : mode === 'area' ? '행사 구역의 가장자리를 차례로 눌러 주세요. 범위와 겹치는 건물에도 행사가 표시됩니다.' : '지도나 아래 목록에서 건물을 선택해 주세요. 여러 건물을 선택할 수 있습니다.'}</p>
	<div class="relative h-72 overflow-hidden rounded-xl border border-brand-border bg-brand-map">
		<div bind:this={mapElement} class="h-full w-full" aria-label="행사 위치 설정 지도"></div>
		{#if loadError}<div class="absolute inset-0 grid content-center gap-3 bg-white/90 p-5 text-center"><p class="m-0 text-[13px] leading-6 text-brand-muted" role="status">{loadError}</p>{#if clientId}<button type="button" class="min-h-11 text-[13px] font-bold text-brand" onclick={initializeMap}>지도 다시 불러오기</button>{/if}</div>{/if}
	</div>
	<input type="hidden" name="location" value={location ? JSON.stringify(location) : ''} />
	{#if mode === 'building'}
		<label class="field-label">건물 찾기<input class="field-input" type="search" placeholder="예: 농심국제관" bind:value={buildingQuery} /></label>
		<div class="max-h-64 overflow-y-auto" aria-label="행사 건물 목록">
			{#each visibleBuildings as spot}<label class="flex min-h-12 items-center justify-between gap-3 border-b border-brand-border py-2 text-[13px]"><span class:font-bold={buildingIds.includes(spot.id)} class:text-brand={buildingIds.includes(spot.id)}>{spot.name}</span><input type="checkbox" class="h-5 w-5 accent-brand" checked={buildingIds.includes(spot.id)} onchange={() => toggleBuilding(spot)} /></label>{:else}<p class="py-3 text-[13px] text-brand-muted">{spotsLoading ? '건물 목록을 불러오는 중입니다.' : '일치하는 건물이 없습니다.'}</p>{/each}
		</div>
		{#if buildingIds.length === 0}<p class="m-0 text-[13px] text-brand-muted">행사가 열리는 건물을 선택해 주세요.</p>{/if}
	{:else if mode === 'area'}
		<div class="flex min-h-11 items-center justify-between gap-2"><span class="text-[13px] font-bold">꼭짓점 {boundary.length}개</span><div class="flex gap-4"><button type="button" class="min-h-11 text-[13px] text-brand-muted disabled:opacity-40" disabled={!boundary.length} onclick={() => setBoundary(boundary.slice(0, -1))}>되돌리기</button><button type="button" class="min-h-11 text-[13px] text-brand-muted disabled:opacity-40" disabled={!boundary.length} onclick={() => setBoundary([])}>다시 그리기</button></div></div>
		{#if !isValidEventBoundary(boundary)}<p class="m-0 text-[13px] text-brand-muted" role="status">꼭짓점을 3개 이상 선택하고, 선이 서로 교차하지 않도록 그려 주세요.</p>{/if}
		<details><summary class="min-h-11 cursor-pointer py-3 text-[13px] text-brand-muted">좌표로 범위 입력</summary><div class="grid grid-cols-2 gap-3"><label class="field-label">꼭짓점 위도<input type="number" class="field-input" min="-90" max="90" step="any" bind:value={pointLatitude} /></label><label class="field-label">꼭짓점 경도<input type="number" class="field-input" min="-180" max="180" step="any" bind:value={pointLongitude} /></label></div><button type="button" class="min-h-11 text-[13px] font-bold text-brand" onclick={() => addPoint({ latitude: pointLatitude, longitude: pointLongitude })}>꼭짓점 추가</button><ol class="m-0 pl-5 text-[12px] leading-6 text-brand-muted">{#each boundary as point}<li>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</li>{/each}</ol></details>
	{/if}
	{#if mode === 'pin'}
		<div class="grid grid-cols-2 gap-3"><label class="field-label">위도<input class="field-input" name="latitude" type="number" min="-90" max="90" step="any" bind:value={latitude} oninput={() => { location = { type: 'pin' }; onchange(); }} required /></label><label class="field-label">경도<input class="field-input" name="longitude" type="number" min="-180" max="180" step="any" bind:value={longitude} oninput={() => { location = { type: 'pin' }; onchange(); }} required /></label></div>
	{:else}<input type="hidden" name="latitude" value={latitude} /><input type="hidden" name="longitude" value={longitude} />{/if}
	{#if spotsError}<div role="status" class="text-[13px] text-brand-muted">{spotsError} <button type="button" class="min-h-11 font-bold text-brand" onclick={loadSpots}>다시 불러오기</button></div>{/if}
	{#if linkedSpots.length}<p class="m-0 text-[13px] leading-6 text-brand" aria-live="polite">함께 표시되는 장소 · {linkedSpots.map((spot) => spot.name).join(', ')}</p>{/if}
</section>

<style>
	.field-label { display:grid; gap:4px; font-size:13px; font-weight:700; }
	.field-input { min-width:0; width:100%; height:44px; border-bottom:1px solid var(--color-brand-border); padding:0 4px; font-size:14px; }
</style>
