<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { Place } from '$lib/domain/places';

	type Props = {
		clientId: string;
		places: Place[];
		activePlaceId: string;
		onMarkerClick: (placeId: string) => void;
	};

	let { clientId, places, activePlaceId, onMarkerClick }: Props = $props();

	let mapElement: HTMLDivElement;
	let map: any = null;
	let markers: any[] = [];
	let isReady = $state(false);
	let loadError = $state('');

	const campusCenter = {
		latitude: 36.6109,
		longitude: 127.2872
	};

	onMount(() => {
		void initMap();
	});

	onDestroy(() => {
		clearMarkers();
		map = null;
	});

	$effect(() => {
		if (!isReady || !map) return;
		syncMarkers(places, activePlaceId);
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
				center: new naver.maps.LatLng(campusCenter.latitude, campusCenter.longitude),
				zoom: 15,
				minZoom: 13,
				maxZoom: 19,
				mapDataControl: false,
				scaleControl: false,
				logoControlOptions: {
					position: naver.maps.Position.BOTTOM_LEFT
				},
				zoomControl: false
			});

			isReady = true;
			syncMarkers(places, activePlaceId);
		} catch {
			loadError = '네이버 지도를 불러오지 못했습니다.';
		}
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
					size: new naver.maps.Size(44, 44),
					anchor: new naver.maps.Point(22, 44)
				}
			});

			naver.maps.Event.addListener(marker, 'click', () => onMarkerClick(place.id));
			markers.push(marker);
		}
	}

	function clearMarkers() {
		for (const marker of markers) {
			marker.setMap(null);
		}
		markers = [];
	}

	function markerHtml(categorySlug: string, isActive: boolean) {
		const label = markerLabel(categorySlug);
		const background = isActive ? '#5f0f2d' : '#a51c45';
		const outline = isActive ? '0 0 0 5px rgba(165, 28, 69, 0.24),' : '';

		return `
			<div style="
				width: 42px;
				height: 42px;
				display: grid;
				place-items: center;
				border: 2px solid white;
				border-radius: 50% 50% 50% 12px;
				background: ${background};
				color: white;
				box-shadow: ${outline}0 10px 24px rgba(103, 16, 43, 0.28);
				transform: rotate(-45deg);
				font-size: 12px;
				font-weight: 900;
			">
				<span style="transform: rotate(45deg);">${label}</span>
			</div>
		`;
	}

	function markerLabel(categorySlug: string) {
		if (categorySlug === 'cafe') return 'CA';
		if (categorySlug === 'cafeteria') return '학';
		if (categorySlug === 'shuttle') return 'BUS';
		return 'FOOD';
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
