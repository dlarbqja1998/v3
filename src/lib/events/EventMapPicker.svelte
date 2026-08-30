<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let {
		clientId,
		latitude = $bindable(36.6095),
		longitude = $bindable(127.287),
		onchange = () => {}
	}: {
		clientId: string;
		latitude?: number;
		longitude?: number;
		onchange?: () => void;
	} = $props();

	let mapElement: HTMLDivElement;
	let map: any;
	let marker: any;
	let loadError = $state('');

	onMount(() => void initializeMap());
	onDestroy(() => marker?.setMap(null));

	async function initializeMap() {
		if (!clientId) {
			loadError = '네이버 지도 Client ID가 설정되지 않았습니다.';
			return;
		}
		try {
			await loadNaverMapScript(clientId);
			const naver = window.naver as any;
			map = new naver.maps.Map(mapElement, {
				center: new naver.maps.LatLng(latitude, longitude),
				zoom: 17,
				minZoom: 12,
				maxZoom: 21,
				mapDataControl: false,
				scaleControl: false,
				zoomControl: true
			});
			naver.maps.Event.addListener(map, 'click', ({ coord }: any) => {
				setPosition(coord.lat(), coord.lng());
			});
			renderMarker();
		} catch {
			loadError = '네이버 지도를 불러오지 못했습니다.';
		}
	}

	function setPosition(nextLatitude: number, nextLongitude: number) {
		latitude = nextLatitude;
		longitude = nextLongitude;
		onchange();
		renderMarker();
	}

	function renderMarker() {
		if (!map || !window.naver) return;
		const naver = window.naver as any;
		const position = new naver.maps.LatLng(latitude, longitude);
		marker?.setMap(null);
		marker = new naver.maps.Marker({
			map,
			position,
			draggable: true,
			zIndex: 200,
			icon: {
				url: '/images/map/event-pin.svg',
				size: new naver.maps.Size(46, 46),
				scaledSize: new naver.maps.Size(46, 46),
				anchor: new naver.maps.Point(23, 43)
			}
		});
		naver.maps.Event.addListener(marker, 'dragend', ({ coord }: any) => {
			setPosition(coord.lat(), coord.lng());
		});
	}

	function loadNaverMapScript(naverClientId: string) {
		if (window.naver?.maps) return Promise.resolve();
		const existing = document.querySelector<HTMLScriptElement>('script[data-naver-map-sdk]');
		if (existing) {
			return new Promise<void>((resolve, reject) => {
				existing.addEventListener('load', () => resolve(), { once: true });
				existing.addEventListener('error', () => reject(), { once: true });
			});
		}
		return new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(naverClientId)}`;
			script.async = true;
			script.defer = true;
			script.dataset.naverMapSdk = 'true';
			script.addEventListener('load', () => resolve(), { once: true });
			script.addEventListener('error', () => reject(), { once: true });
			document.head.appendChild(script);
		});
	}
</script>

<section aria-labelledby="event-location-title">
	<div class="mb-3 flex items-end justify-between gap-3">
		<div>
			<h2 id="event-location-title" class="m-0 text-[15px] font-black">지도 위치</h2>
			<p class="m-0 mt-1 text-[13px] text-brand-muted">지도를 누르거나 핀을 드래그해 위치를 정하세요.</p>
		</div>
	</div>
	<div class="relative h-72 overflow-hidden rounded-xl border border-brand-border bg-brand-map">
		<div bind:this={mapElement} class="h-full w-full"></div>
		{#if loadError}<p class="absolute inset-0 grid place-items-center bg-white/90 p-5 text-center text-[13px] font-bold text-brand-muted">{loadError}</p>{/if}
	</div>
	<div class="mt-3 grid grid-cols-2 gap-3">
		<label class="field-label">위도<input class="field-input" name="latitude" type="number" step="any" bind:value={latitude} oninput={onchange} required /></label>
		<label class="field-label">경도<input class="field-input" name="longitude" type="number" step="any" bind:value={longitude} oninput={onchange} required /></label>
	</div>
</section>

<style>
	.field-label { display:grid; gap:4px; font-size:13px; font-weight:700; }
	.field-input { height:44px; border-bottom:1px solid var(--color-brand-border); padding:0 4px; font-size:14px; }
</style>
