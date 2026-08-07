<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { ArrowLeft, RotateCcw, Save } from '@lucide/svelte';
	import type { CampusCoordinate, CampusSpot } from '$lib/domain/campus-spots';
	import { insertBoundaryPointOnNearestEdge } from '$lib/map/boundary-editor';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { saveError?: string; saved?: boolean } | null } = $props();
	let selectedId = $state('');
	let boundary = $state<CampusCoordinate[]>([]);
	let mapElement: HTMLDivElement;
	let map: any;
	let polygon: any;
	let vertexMarkers: any[] = [];
	let loadError = $state('');

	const selectedSpot = $derived(data.spots.find((spot) => spot.id === selectedId) ?? null);

	$effect(() => {
		if (selectedId || data.spots.length === 0) return;
		selectedId = data.spots[0].id;
		boundary = data.spots[0].boundary;
	});

	onMount(() => {
		void initializeMap();
	});

	onDestroy(() => clearDrawing());

	function chooseSpot(event: Event) {
		selectedId = (event.currentTarget as HTMLSelectElement).value;
		boundary = data.spots.find((spot) => spot.id === selectedId)?.boundary ?? [];
		renderDrawing(true);
	}

	function resetBoundary() {
		boundary = selectedSpot?.boundary ?? [];
		renderDrawing(true);
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
				center: new naver.maps.LatLng(36.6095, 127.287), zoom: 16, minZoom: 15, maxZoom: 20,
				mapDataControl: false, scaleControl: false, zoomControl: true
			});
			naver.maps.Event.addListener(map, 'click', (event: { coord: { lat: () => number; lng: () => number } }) => {
				boundary = insertBoundaryPointOnNearestEdge(boundary, {
					latitude: event.coord.lat(),
					longitude: event.coord.lng()
				});
				renderDrawing(false);
			});
			renderDrawing(true);
		} catch {
			loadError = '네이버 지도를 불러오지 못했습니다.';
		}
	}

	function renderDrawing(shouldFocus: boolean) {
		if (!map || !window.naver) return;
		clearDrawing();
		const naver = window.naver as any;
		const paths = boundary.map((point) => new naver.maps.LatLng(point.latitude, point.longitude));
		if (paths.length >= 3) {
			polygon = new naver.maps.Polygon({ map, paths, fillColor: '#a51c45', fillOpacity: 0.18, strokeColor: '#8a1538', strokeOpacity: 0.9, strokeWeight: 2 });
		}
		vertexMarkers = boundary.map((point, index) => {
			const marker = new naver.maps.Marker({ position: new naver.maps.LatLng(point.latitude, point.longitude), map, draggable: true, title: `${index + 1}번째 꼭짓점` });
			naver.maps.Event.addListener(marker, 'dragend', (event: { coord: { lat: () => number; lng: () => number } }) => {
				boundary = boundary.map((item, itemIndex) => itemIndex === index ? { latitude: event.coord.lat(), longitude: event.coord.lng() } : item);
				renderDrawing(false);
			});
			naver.maps.Event.addListener(marker, 'rightclick', () => {
				if (boundary.length <= 3) return;
				boundary = boundary.filter((_, itemIndex) => itemIndex !== index);
				renderDrawing(false);
			});
			return marker;
		});
		if (shouldFocus && selectedSpot) map.panTo(new naver.maps.LatLng(selectedSpot.center.latitude, selectedSpot.center.longitude));
	}

	function clearDrawing() {
		polygon?.setMap(null);
		polygon = null;
		for (const marker of vertexMarkers) marker.setMap(null);
		vertexMarkers = [];
	}

	function loadNaverMapScript(clientId: string) {
		if (window.naver?.maps) return Promise.resolve();

		const existingScript = document.querySelector<HTMLScriptElement>('script[data-naver-map-sdk]');
		if (existingScript) {
			return waitForNaverMap(existingScript);
		}

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

<svelte:head><title>캠퍼스 구역 편집 | 골라바유</title></svelte:head>

<main class="min-h-screen bg-brand-bg p-4 text-brand-text md:p-6">
	<section class="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-[280px_1fr]">
		<aside class="grid content-start gap-4 rounded-[8px] border border-brand-border bg-white p-4">
			<a class="flex items-center gap-2 self-start text-sm font-black text-brand" href="/">
				<ArrowLeft size={18} strokeWidth={2.8} />
				나가기
			</a>
			<div><p class="m-0 text-xs font-black text-brand-muted">관리자</p><h1 class="m-0 mt-1 text-xl font-black">캠퍼스 구역 편집</h1></div>
			<label class="grid gap-2 text-sm font-bold">구역<select class="rounded-[8px] border border-brand-border px-3 py-2.5" value={selectedId} onchange={chooseSpot}>{#each data.spots as spot}<option value={spot.id}>{spot.name}</option>{/each}</select></label>
			<p class="m-0 text-sm font-bold leading-6 text-brand-muted">지도를 눌러 꼭짓점을 추가하고, 점을 드래그해 조정하세요. 점을 오른쪽 클릭하면 삭제합니다.</p>
			<p class="m-0 text-sm font-black text-brand">꼭짓점 {boundary.length}개</p>
			<button class="flex items-center justify-center gap-2 rounded-[8px] border border-brand-border px-3 py-2.5 text-sm font-black" type="button" onclick={resetBoundary}><RotateCcw size={16} />원본으로 되돌리기</button>
			<form method="POST" action="?/save" class="grid gap-2"><input type="hidden" name="id" value={selectedId} /><input type="hidden" name="boundary" value={JSON.stringify(boundary)} /><button class="flex items-center justify-center gap-2 rounded-[8px] bg-brand px-3 py-3 text-sm font-black text-white" type="submit" disabled={boundary.length < 3}><Save size={16} />변경 저장</button></form>
			{#if form?.saveError}<p class="m-0 text-sm font-bold text-red-700">{form.saveError}</p>{/if}
			{#if form?.saved}<p class="m-0 text-sm font-bold text-emerald-700">저장했고, 공개 지도 캐시도 갱신했습니다.</p>{/if}
		</aside>
		<section class="relative h-[65dvh] min-h-[480px] overflow-hidden rounded-[8px] border border-brand-border bg-white md:h-[calc(100dvh-3rem)]"><div class="absolute inset-0"><div bind:this={mapElement} class="h-full w-full"></div></div>{#if loadError}<p class="absolute inset-0 grid place-items-center p-6 text-center text-sm font-bold text-brand-muted">{loadError}</p>{/if}</section>
	</section>
</main>
