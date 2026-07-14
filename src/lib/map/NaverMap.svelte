<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Place } from '$lib/domain/places';

	type Props = {
		clientId: string;
		places: Place[];
		activePlaceId: string;
		focusMode?: 'default' | 'top-band';
		onMarkerClick: (placeId: string) => void;
	};

	let { clientId, places, activePlaceId, focusMode = 'default', onMarkerClick }: Props = $props();

	let mapElement: HTMLDivElement;
	let map: any = null;
	let markers: any[] = [];
	let mapListeners: any[] = [];
	let isReady = $state(false);
	let loadError = $state('');

	const initialTarget = {
		latitude: 36.608634852584125,
		longitude: 127.28902073594871
	};
	const initialZoom = 16;
	const minZoom = 15;
	const maxZoom = 19;
	const fivePixelLatitudeOffset = 0.000086;
	const serviceBounds = {
		south: 36.5965,
		west: 127.2765,
		north: 36.6215,
		east: 127.3065
	};

	const initialCenter = {
		latitude: initialTarget.latitude + fivePixelLatitudeOffset,
		longitude: initialTarget.longitude
	};

	onMount(() => {
		void initMap();
	});

	onDestroy(() => {
		clearMapListeners();
		clearMarkers();
		map = null;
	});

	$effect(() => {
		if (!isReady || !map) return;
		syncMarkers(places, activePlaceId);
		focusActivePlace(places, activePlaceId, focusMode);
	});

	async function initMap() {
		if (!clientId) {
			loadError = '네이버 지도 Client ID가 설정되지 않았습니다.';
			return;
		}

		try {
			await loadNaverMapScript(clientId);

			const naver = window.naver;
			if (!naver) throw new Error('Naver map SDK is not available.');

			map = new naver.maps.Map(mapElement, {
				center: new naver.maps.LatLng(initialCenter.latitude, initialCenter.longitude),
				zoom: initialZoom,
				minZoom,
				maxZoom,
				mapDataControl: false,
				scaleControl: false,
				logoControlOptions: {
					position: naver.maps.Position.BOTTOM_LEFT
				},
				zoomControl: false
			});

			bindMapGuards();
			isReady = true;
			syncMarkers(places, activePlaceId);
		} catch {
			loadError = '네이버 지도를 불러오지 못했습니다.';
		}
	}

	function bindMapGuards() {
		const naver = window.naver;
		if (!naver || !map) return;

		mapListeners = [
			naver.maps.Event.addListener(map, 'idle', keepMapInServiceArea),
			naver.maps.Event.addListener(map, 'dragend', keepMapInServiceArea),
			naver.maps.Event.addListener(map, 'zoom_changed', keepZoomInServiceArea)
		];
	}

	function keepZoomInServiceArea() {
		if (!map) return;

		const zoom = map.getZoom();
		if (zoom < minZoom) map.setZoom(minZoom);
		if (zoom > maxZoom) map.setZoom(maxZoom);
		keepMapInServiceArea();
	}

	function keepMapInServiceArea() {
		const naver = window.naver;
		if (!naver || !map) return;

		const center = map.getCenter();
		const nextLatitude = clamp(center.lat(), serviceBounds.south, serviceBounds.north);
		const nextLongitude = clamp(center.lng(), serviceBounds.west, serviceBounds.east);

		if (nextLatitude !== center.lat() || nextLongitude !== center.lng()) {
			map.setCenter(new naver.maps.LatLng(nextLatitude, nextLongitude));
		}
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	function syncMarkers(nextPlaces: Place[], nextActivePlaceId: string) {
		clearMarkers();

		const naver = window.naver;
		if (!naver) return;

		for (const place of nextPlaces) {
			const isActive = place.id === nextActivePlaceId;
			const marker = new naver.maps.Marker({
				position: new naver.maps.LatLng(place.latitude, place.longitude),
				map,
				title: place.name,
				icon: {
					content: markerHtml(place.categorySlug, isActive),
					size: new naver.maps.Size(32, 32),
					anchor: new naver.maps.Point(16, 32)
				}
			});

			naver.maps.Event.addListener(marker, 'click', () => onMarkerClick(place.id));
			markers.push(marker);
		}
	}

	function focusActivePlace(
		nextPlaces: Place[],
		nextActivePlaceId: string,
		nextFocusMode: 'default' | 'top-band'
	) {
		const naver = window.naver;
		if (!naver || !map || !nextActivePlaceId) return;

		const activePlace = nextPlaces.find((place) => place.id === nextActivePlaceId);
		if (!activePlace) return;

		const sheetAwareLatitudeOffset = getFocusLatitudeOffset(
			activePlace.latitude,
			map.getZoom(),
			nextFocusMode
		);
		const center = new naver.maps.LatLng(
			activePlace.latitude - sheetAwareLatitudeOffset,
			activePlace.longitude
		);

		if (typeof map.panTo === 'function') {
			map.panTo(center);
			return;
		}

		map.setCenter(center);
	}

	function getFocusLatitudeOffset(
		latitude: number,
		zoom: number,
		nextFocusMode: 'default' | 'top-band'
	) {
		if (nextFocusMode === 'default') {
			return 0.00115;
		}

		const mapHeight = mapElement?.clientHeight || window.innerHeight || 800;
		const markerTargetRatio = 0.1;
		const markerCenterRatio = 0.5;
		const verticalShiftPixels = mapHeight * (markerCenterRatio - markerTargetRatio);
		const metersPerPixel =
			(156543.03392 * Math.cos((latitude * Math.PI) / 180)) / Math.pow(2, zoom);
		const latitudeDegreesPerMeter = 1 / 111320;

		return verticalShiftPixels * metersPerPixel * latitudeDegreesPerMeter;
	}

	function clearMarkers() {
		for (const marker of markers) {
			marker.setMap(null);
		}
		markers = [];
	}

	function clearMapListeners() {
		if (typeof window === 'undefined') return;

		const naver = window.naver;
		if (!naver) return;

		for (const listener of mapListeners) {
			(naver.maps.Event as any).removeListener(listener);
		}
		mapListeners = [];
	}

	function markerHtml(categorySlug: string, isActive: boolean) {
		const background = isActive ? '#5f0f2d' : '#a51c45';
		const outline = isActive ? '0 0 0 5px rgba(165, 28, 69, 0.24),' : '';

		return `
			<div style="
				width: 30px;
				height: 30px;
				display: grid;
				place-items: center;
				border: 2px solid rgba(255, 255, 255, 0.96);
				border-radius: 50% 50% 50% 8px;
				background: ${background};
				color: white;
				box-shadow: ${outline}0 8px 18px rgba(103, 16, 43, 0.24);
				transform: rotate(-45deg);
			"></div>
		`;
	}

	function loadNaverMapScript(nextClientId: string) {
		if (window.naver?.maps) return Promise.resolve();

		const existingScript = document.querySelector<HTMLScriptElement>('script[data-naver-map-sdk]');
		if (existingScript) {
			return new Promise<void>((resolve, reject) => {
				existingScript.addEventListener('load', () => resolve(), { once: true });
				existingScript.addEventListener('error', () => reject(), { once: true });
			});
		}

		return new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(nextClientId)}`;
			script.async = true;
			script.defer = true;
			script.dataset.naverMapSdk = 'true';
			script.addEventListener('load', () => resolve(), { once: true });
			script.addEventListener('error', () => reject(), { once: true });
			document.head.appendChild(script);
		});
	}
</script>

<div class="absolute inset-0">
	<div bind:this={mapElement} class="h-full w-full"></div>

	{#if !clientId || loadError}
		<div
			class="absolute inset-0 grid place-items-center bg-brand-map px-8 text-center text-sm font-bold text-brand-muted"
		>
			{loadError || '네이버 지도 Client ID가 필요합니다.'}
		</div>
	{:else if !isReady}
		<div
			class="absolute inset-0 grid place-items-center bg-brand-map px-8 text-center text-sm font-bold text-brand-muted"
		>
			고려대 세종캠퍼스 지도를 불러오는 중입니다.
		</div>
	{/if}
</div>
