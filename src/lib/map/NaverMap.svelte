<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { CampusSpot } from '$lib/domain/campus-spots';
	import {
		getCommercialZoneBounds,
		getVisibleCommercialZones,
		type CommercialZone,
		type MapAreaMode
	} from '$lib/domain/commercial-zones';
	import { shouldShowCampusCenterMarker } from '$lib/domain/campus-boundary-visibility';
	import type { Place } from '$lib/domain/places';
	import { getSafeMarkerIcon } from '$lib/map/marker-icon';
	import { getCampusPolygonStyle } from '$lib/map/campus-polygon';
	import { cancelMapMotion } from '$lib/map/map-motion';
	import { getCommercialPolygonStyle } from '$lib/map/commercial-polygon';
	import {
		getNaverLogoControlPosition,
		watchNaverAttributionLogo
	} from '$lib/map/naver-attribution';
	import {
		getMapCenterBounds,
		getSheetAwareLatitudeOffset,
		shouldFocusMapArea,
		type MapFocusMode
	} from '$lib/map/focus';

	type Props = {
		clientId: string;
		places: Place[];
		activePlaceId: string;
		focusMode?: MapFocusMode;
		focusRequestId?: number;
		focusZoom?: number;
		focusTargetRatio?: number;
		campusSpots?: CampusSpot[];
		activeCampusSpotId?: string;
		focusCampusSpotId?: string;
		showCampusBoundaries?: boolean;
		onMarkerClick: (placeId: string) => void;
		onCampusSpotClick?: (spotId: string) => void;
		events?: { id: string; title: string; latitude: number; longitude: number }[];
		activeEventId?: string;
		onEventMarkerClick?: (eventId: string) => void;
		attributionBottomOffset?: number;
		areaMode?: MapAreaMode;
		commercialZones?: CommercialZone[];
		selectedCommercialZoneId?: string;
	};

	let {
		clientId,
		places,
		activePlaceId,
		focusMode = 'default',
		focusRequestId = 0,
		focusZoom,
		focusTargetRatio,
		campusSpots = [],
		activeCampusSpotId = '',
		focusCampusSpotId = '',
		showCampusBoundaries = false,
		onMarkerClick,
		onCampusSpotClick,
		events = [],
		activeEventId = '',
		onEventMarkerClick,
		attributionBottomOffset = 0,
		areaMode = 'campus',
		commercialZones = [],
		selectedCommercialZoneId = 'all'
	}: Props = $props();

	let mapElement: HTMLDivElement;
	let map: any = null;
	let markers: any[] = [];
	let eventMarkers: any[] = [];
	let campusMarkers: any[] = [];
	let campusPolygons: any[] = [];
	let commercialPolygons: any[] = [];
	let mapListeners: any[] = [];
	let isReady = $state(false);
	let loadError = $state('');
	let lastFocusRequestId = -1;

	const initialTarget = {
		latitude: 36.608634852584125,
		longitude: 127.28902073594871
	};
	const initialZoom = 16;
	const minZoom = 15;
	const outsideMinZoom = 11;
	const maxZoom = 19;
	const fivePixelLatitudeOffset = 0.000086;
	const serviceBounds = getMapCenterBounds();

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
		clearEventMarkers();
		clearCampusSpots();
		clearCommercialZones();
		map = null;
	});

	$effect(() => {
		if (!isReady || !map) return;
		if (focusRequestId !== lastFocusRequestId) {
			lastFocusRequestId = focusRequestId;
			if (focusZoom !== undefined) map.setZoom(focusZoom);
		}
		syncMarkers(places, activePlaceId);
		syncEventMarkers(events, activeEventId);
		syncCampusSpots(campusSpots, activeCampusSpotId, showCampusBoundaries);
		focusActivePlace(places, activePlaceId, focusMode, focusTargetRatio);
		focusActiveEvent(events, activeEventId, focusMode, focusTargetRatio);
		focusActiveCampusSpot(campusSpots, focusCampusSpotId, focusMode);
	});

	$effect(() => {
		const bottomOffset = Math.max(0, attributionBottomOffset);
		if (!isReady || typeof MutationObserver === 'undefined') return;

		return watchNaverAttributionLogo(mapElement, bottomOffset, (callback) => {
			const observer = new MutationObserver(callback);
			return {
				observe: () => observer.observe(mapElement, { childList: true, subtree: true }),
				disconnect: () => observer.disconnect()
			};
		});
	});

	$effect(() => {
		if (!isReady || !map) return;
		syncCommercialZones(areaMode, commercialZones, selectedCommercialZoneId);
		if (!shouldFocusMapArea(activePlaceId)) return;
		focusMapArea(areaMode, commercialZones, selectedCommercialZoneId);
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
				minZoom: outsideMinZoom,
				maxZoom,
				mapDataControl: false,
				scaleControl: false,
				logoControlOptions: {
					position: getNaverLogoControlPosition(naver.maps.Position)
				},
				zoomControl: false
			});

			bindMapGuards();
			isReady = true;
			syncMarkers(places, activePlaceId);
			syncEventMarkers(events, activeEventId);
		} catch {
			loadError = '네이버 지도를 불러오지 못했습니다.';
		}
	}

	function bindMapGuards() {
		const naver = window.naver;
		if (!naver || !map) return;

		mapListeners = [
			naver.maps.Event.addListener(map, 'idle', keepMapInServiceArea),
			naver.maps.Event.addListener(map, 'mousedown', () => cancelMapMotion(map)),
			naver.maps.Event.addListener(map, 'touchstart', () => cancelMapMotion(map)),
			naver.maps.Event.addListener(map, 'dragstart', () => cancelMapMotion(map)),
			naver.maps.Event.addListener(map, 'dragend', keepMapInServiceArea),
			naver.maps.Event.addListener(map, 'zoom_changed', keepZoomInServiceArea)
		];
	}

	function keepZoomInServiceArea() {
		if (!map) return;

		const zoom = map.getZoom();
		const activeMinZoom = areaMode === 'outside' ? outsideMinZoom : minZoom;
		if (zoom < activeMinZoom) map.setZoom(activeMinZoom);
		if (zoom > maxZoom) map.setZoom(maxZoom);
		keepMapInServiceArea();
	}

	function keepMapInServiceArea() {
		if (areaMode === 'outside') return;
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
					content: markerHtml(place.icon, place.categorySlug, isActive),
					size: new naver.maps.Size(32, 32),
					anchor: new naver.maps.Point(16, 32)
				}
			});

			naver.maps.Event.addListener(marker, 'click', () => onMarkerClick(place.id));
			markers.push(marker);
		}
	}

	function syncEventMarkers(
		nextEvents: { id: string; title: string; latitude: number; longitude: number }[],
		nextActiveEventId: string
	) {
		clearEventMarkers();
		const naver = window.naver;
		if (!naver) return;
		for (const event of nextEvents) {
			const isActive = event.id === nextActiveEventId;
			const marker = new naver.maps.Marker({
				position: new naver.maps.LatLng(event.latitude, event.longitude),
				map,
				title: event.title,
				zIndex: isActive ? 300 : 180,
				icon: {
					url: '/images/map/event-pin.svg',
					size: new naver.maps.Size(isActive ? 50 : 42, isActive ? 50 : 42),
					scaledSize: new naver.maps.Size(isActive ? 50 : 42, isActive ? 50 : 42),
					anchor: new naver.maps.Point(isActive ? 25 : 21, isActive ? 47 : 40)
				}
			});
			naver.maps.Event.addListener(marker, 'click', () => onEventMarkerClick?.(event.id));
			eventMarkers.push(marker);
		}
	}

	function syncCommercialZones(
		nextAreaMode: MapAreaMode,
		nextZones: CommercialZone[],
		nextSelectedZoneId: string
	) {
		clearCommercialZones();
		if (nextAreaMode !== 'outside' || !map) return;

		const naver = window.naver;
		if (!naver) return;

		for (const zone of getVisibleCommercialZones(nextZones, nextSelectedZoneId)) {
			if (zone.boundary.length < 3) continue;
			const polygon = new naver.maps.Polygon({
				map,
				paths: zone.boundary.map(
					({ latitude, longitude }) => new naver.maps.LatLng(latitude, longitude)
				),
				...getCommercialPolygonStyle(nextSelectedZoneId === zone.id)
			});
			commercialPolygons.push(polygon);
		}
	}

	function focusMapArea(
		nextAreaMode: MapAreaMode,
		nextZones: CommercialZone[],
		nextSelectedZoneId: string
	) {
		const naver = window.naver;
		if (!naver || !map) return;

		if (nextAreaMode === 'campus') {
			map.setCenter(new naver.maps.LatLng(initialCenter.latitude, initialCenter.longitude));
			map.setZoom(initialZoom);
			return;
		}

		const visibleZones = getVisibleCommercialZones(nextZones, nextSelectedZoneId);
		const bounds = getCommercialZoneBounds(visibleZones, nextSelectedZoneId);
		if (!bounds) return;

		if (bounds.north === bounds.south && bounds.east === bounds.west) {
			map.setCenter(new naver.maps.LatLng(bounds.north, bounds.east));
			map.setZoom(16);
			return;
		}

		const mapBounds = new naver.maps.LatLngBounds(
			new naver.maps.LatLng(bounds.south, bounds.west),
			new naver.maps.LatLng(bounds.north, bounds.east)
		);
		map.fitBounds(mapBounds, {
			top: 170,
			right: 28,
			bottom: 250,
			left: 28,
			maxZoom: 17
		});

		if (nextSelectedZoneId !== 'all') {
			const selectedZone = visibleZones[0];
			if (selectedZone) {
				map.setCenter(
					new naver.maps.LatLng(selectedZone.center.latitude, selectedZone.center.longitude)
				);
			}
		}
	}

	function syncCampusSpots(
		nextCampusSpots: CampusSpot[],
		nextActiveCampusSpotId: string,
		shouldShowCampusBoundaries: boolean
	) {
		clearCampusSpots();
		if (!shouldShowCampusBoundaries) return;

		const naver = window.naver;
		if (!naver) return;
		const maps = naver.maps as any;

		for (const spot of nextCampusSpots) {
			const isActive = shouldShowCampusCenterMarker(nextActiveCampusSpotId, spot.id);
			const polygon = new maps.Polygon({
				map,
				paths: spot.boundary.map(
					({ latitude, longitude }) => new naver.maps.LatLng(latitude, longitude)
				),
				...getCampusPolygonStyle(isActive)
			});
			naver.maps.Event.addListener(polygon, 'click', () => onCampusSpotClick?.(spot.id));
			campusPolygons.push(polygon);

			if (isActive) {
				const marker = new naver.maps.Marker({
					position: new naver.maps.LatLng(spot.center.latitude, spot.center.longitude),
					map,
					title: spot.name,
					icon: {
						content: campusMarkerHtml(true),
						size: new naver.maps.Size(24, 24),
						anchor: new naver.maps.Point(12, 12)
					}
				});
				naver.maps.Event.addListener(marker, 'click', () => onCampusSpotClick?.(spot.id));
				campusMarkers.push(marker);
			}
		}
	}

	function focusActivePlace(
		nextPlaces: Place[],
		nextActivePlaceId: string,
		nextFocusMode: MapFocusMode,
		nextFocusTargetRatio?: number
	) {
		if (!map || !nextActivePlaceId) return;

		const activePlace = nextPlaces.find((place) => place.id === nextActivePlaceId);
		if (!activePlace) return;

		focusCoordinate(activePlace.latitude, activePlace.longitude, nextFocusMode, nextFocusTargetRatio);
	}

	function focusActiveCampusSpot(
		nextCampusSpots: CampusSpot[],
		nextActiveCampusSpotId: string,
		nextFocusMode: MapFocusMode
	) {
		if (!nextActiveCampusSpotId) return;

		const activeCampusSpot = nextCampusSpots.find((spot) => spot.id === nextActiveCampusSpotId);
		if (!activeCampusSpot) return;

		focusCoordinate(activeCampusSpot.center.latitude, activeCampusSpot.center.longitude, nextFocusMode);
	}

	function focusActiveEvent(
		nextEvents: { id: string; latitude: number; longitude: number }[],
		nextActiveEventId: string,
		nextFocusMode: MapFocusMode,
		nextFocusTargetRatio?: number
	) {
		if (!nextActiveEventId) return;
		const activeEvent = nextEvents.find((event) => event.id === nextActiveEventId);
		if (!activeEvent) return;
		focusCoordinate(activeEvent.latitude, activeEvent.longitude, nextFocusMode, nextFocusTargetRatio);
	}

	function focusCoordinate(
		latitude: number,
		longitude: number,
		nextFocusMode: MapFocusMode,
		nextFocusTargetRatio?: number
	) {
		const naver = window.naver;
		if (!naver || !map) return;

		const sheetAwareLatitudeOffset = getSheetAwareLatitudeOffset({
			latitude,
			zoom: map.getZoom(),
			mapHeight: mapElement?.clientHeight || window.innerHeight || 800,
			focusMode: nextFocusMode,
			markerTargetRatio: nextFocusTargetRatio
		});
		const center = new naver.maps.LatLng(latitude - sheetAwareLatitudeOffset, longitude);

		if (typeof map.panTo === 'function') {
			map.panTo(center);
			return;
		}

		map.setCenter(center);
	}

	function clearMarkers() {
		for (const marker of markers) {
			marker.setMap(null);
		}
		markers = [];
	}

	function clearEventMarkers() {
		for (const marker of eventMarkers) marker.setMap(null);
		eventMarkers = [];
	}

	function clearCampusSpots() {
		for (const polygon of campusPolygons) {
			polygon.setMap(null);
		}
		for (const marker of campusMarkers) {
			marker.setMap(null);
		}
		campusPolygons = [];
		campusMarkers = [];
	}

	function clearCommercialZones() {
		for (const polygon of commercialPolygons) {
			polygon.setMap(null);
		}
		commercialPolygons = [];
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

	function markerHtml(icon: string, categorySlug: string, isActive: boolean) {
		const isShuttle = categorySlug === 'shuttle';
		const background = isActive ? '#5f0f2d' : isShuttle ? '#1f6f78' : '#a51c45';
		const outline = isActive ? '0 0 0 5px rgba(165, 28, 69, 0.24),' : '';
		const safeIcon = getSafeMarkerIcon(icon === '식당' ? 'food' : icon === '버스' ? 'bus' : icon);
		const content = safeIcon
			? `<span style="display:block;width:18px;height:18px;background:#fff;mask:url('/24 icon/${safeIcon}.svg') center/contain no-repeat;-webkit-mask:url('/24 icon/${safeIcon}.svg') center/contain no-repeat;"></span>`
			: '';

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
				font-size: 8px;
				font-weight: 900;
				letter-spacing: 0;
				box-shadow: ${outline}0 8px 18px rgba(103, 16, 43, 0.24);
				transform: rotate(-45deg);
			">
				<span style="transform: rotate(45deg);display:grid;place-items:center;">${content}</span>
			</div>
		`;
	}

	function campusMarkerHtml(isActive: boolean) {
		const background = isActive ? '#5f0f2d' : '#a51c45';
		const outline = isActive ? '0 0 0 5px rgba(165, 28, 69, 0.24),' : '';

		return `
			<div style="
				width: 18px;
				height: 18px;
				border: 3px solid rgba(255, 255, 255, 0.96);
				border-radius: 50%;
				background: ${background};
				box-shadow: ${outline}0 5px 12px rgba(103, 16, 43, 0.24);
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

<div
	class="absolute inset-0"
	data-map-layer="background"
	data-map-attribution-bottom-offset={attributionBottomOffset}
	style="isolation: isolate; z-index: 0;"
>
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
