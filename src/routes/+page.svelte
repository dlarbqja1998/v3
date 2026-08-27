<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { env as publicEnv } from '$env/dynamic/public';
	import {
		Bus,
		ChevronDown,
		ChevronUp,
		MapPin,
		ThumbsDown,
		ThumbsUp,
		Utensils,
		Users
	} from '@lucide/svelte';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import FacilityFilterChips from '$lib/home/FacilityFilterChips.svelte';
	import HomeMapHeader from '$lib/home/HomeMapHeader.svelte';
	import OutsidePlaceFilters from '$lib/home/OutsidePlaceFilters.svelte';
	import {
		getNextActivePlaceId,
		getVisibleFacilityPlaces
	} from '$lib/home/facility-discovery';
	import { getHomeMapResetState } from '$lib/home/home-map-state';
	import {
		CAMPUS_AREA_ID,
		changeSelectedMapArea,
		type MapAreaMode
	} from '$lib/domain/commercial-zones';
	import type {
		OutsideCuisine,
		OutsidePlaceCategory
	} from '$lib/domain/outside-place-filters';
	import {
		DEFAULT_CAMPUS_BOUNDARIES_VISIBLE,
		DEFAULT_HOME_CAMPUS_SPOT_ID,
		DEFAULT_HOME_MAP_ZOOM
	} from '$lib/domain/campus-boundary-visibility';
	import type { BottomNavigationKey } from '$lib/domain/bottom-navigation';
	import {
		clampBottomSheetHeight,
		getBottomSheetHeights,
		getNextBottomSheetDetent,
		getWeatherWidgetBottomOffset,
		resolveBottomSheetDetent,
		type BottomSheetDetent
	} from '$lib/domain/bottom-sheet';
	import { resolveApiUrl } from '$lib/api/base-url';
	import { isWeatherSnapshot, type WeatherSnapshot } from '$lib/domain/weather';
	import { getCampusSpotPanelPresentation, type CampusSpot } from '$lib/domain/campus-spots';
	import { getAvailableMapMarkerTargetRatio, getPlaceFocusZoom } from '$lib/map/focus';
	import NaverMap from '$lib/map/NaverMap.svelte';
	import WeatherWidget from '$lib/weather/WeatherWidget.svelte';
	import type { CafeteriaPanelItem, DailyMenu, MenuDayKey } from '$lib/domain/places';
	import {
		formatMinutesLeft,
		getUpcomingShuttles,
		shuttleSchedules,
		shuttleStops,
		type ShuttleStopId
	} from '$lib/domain/shuttle';
	import { createOfferingKey, getVoteWindow, type OfferingFeedbackSummary } from '$lib/domain/cafeteria-feedback';
	import type { PageData } from './$types';

type MealItem = {
		name: string;
		feedbackKey: string;
		feedback: (OfferingFeedbackSummary & { offeringId: string; isVotable: boolean }) | undefined;
		mealSlot: 'breakfast' | 'lunch' | 'dinner' | 'all_day';
		menuDate: string;
};

type CafeteriaFeedbackMap = Record<
	string,
	OfferingFeedbackSummary & { offeringId: string; isVotable: boolean }
>;

	type MealSection = {
		id: string;
		name: string;
		items: MealItem[];
	};

	type SheetMode = 'home' | 'facility' | 'cafeteria' | 'shuttle' | 'pin' | 'place';
	const WEATHER_WIDGET_GAP = 12;

	let { data }: { data: PageData } = $props();

	let selectedZone = $state('all');
	let areaMode = $state<MapAreaMode>('campus');
	let selectedMapAreaId = $state(CAMPUS_AREA_ID);
	let selectedCommercialZoneId = $state('all');
	let selectedOutsideCategory = $state<OutsidePlaceCategory>('all');
	let selectedOutsideCuisine = $state<OutsideCuisine>('all');
	let selectedCategory = $state('all');
	let selectedFacilityCategory = $state('all');
	let facilitySearchOpen = $state(false);
	let facilitySearchQuery = $state('');
	let hasSelectedPinFilter = $state(false);
	let activePlaceId = $state('');
	let activeCampusSpotId = $state('');
	let focusCampusSpotId = $state(DEFAULT_HOME_CAMPUS_SPOT_ID);
	let homeFocusRequestId = $state(0);
	let showCampusBoundaries = $state(DEFAULT_CAMPUS_BOUNDARIES_VISIBLE);
	let campusSpots = $state<CampusSpot[]>([]);
	let campusSpotsLoading = $state(false);
	let campusSpotsError = $state('');
	let sheetMode = $state<SheetMode>('home');
	let activeCafeteriaIndex = $state(0);
	let activeDayKey = $state<MenuDayKey>('mon');
	let expandedMealId = $state('');
	let cafeteriaScroller = $state<HTMLDivElement>();
	let facilityScroller = $state<HTMLDivElement>();
	let shuttleScroller = $state<HTMLDivElement>();
	let activeShuttleStopId = $state<ShuttleStopId>('campus');
	let currentTime = $state(new Date());
	let cafeteriaFeedback = $state<CafeteriaFeedbackMap>({});
	let appShellElement = $state<HTMLElement>();
	let sheetElement = $state<HTMLElement>();
	let sheetDetent = $state<BottomSheetDetent>('collapsed');
	let sheetHeight = $state(160);
	let mapViewportHeight = $state(844);
	let bottomNavigationHeight = $state(73);
	let weatherWidgetBottom = $state(getWeatherWidgetBottomOffset(844, 73, WEATHER_WIDGET_GAP));
	let weather = $state<WeatherSnapshot | null>(null);
	let weatherLoading = $state(true);
	let weatherError = $state(false);
	let isSheetDragging = $state(false);
	let activeSheetPointerId: number | null = null;
	let dragStartY = 0;
	let dragStartHeight = 0;
	let lastPointerY = 0;
	let lastPointerTime = 0;
	let dragVelocityY = 0;

	$effect(() => {
		cafeteriaFeedback = { ...data.cafeteriaFeedback } as CafeteriaFeedbackMap;
	});

	const filteredPlaces = $derived(
		data.places.filter((place) => {
			if (!hasSelectedPinFilter) return false;
			if (place.type === 'shuttle_stop') return false;

			const zoneMatched = selectedZone === 'all' || place.zoneId === selectedZone;
			const categoryMatched = selectedCategory === 'all' || place.categorySlug === selectedCategory;
			return zoneMatched && categoryMatched;
		})
	);

	const activeCafeteria = $derived(
		data.cafeterias[activeCafeteriaIndex] ?? data.cafeterias[0] ?? null
	);
	const facilityPlaces = $derived(
		getVisibleFacilityPlaces(data.places, {
			scope: areaMode,
			zoneId: areaMode === 'outside' ? selectedCommercialZoneId : 'all',
			categorySlug: selectedFacilityCategory,
			query: facilitySearchQuery
		})
	);
	const activeFacilityPlace = $derived(
		facilityPlaces.find((place) => place.id === activePlaceId) ?? facilityPlaces[0] ?? null
	);

	const activePlace = $derived(
		sheetMode === 'facility'
			? activeFacilityPlace
			: sheetMode === 'place'
			? (data.places.find((place) => place.id === activePlaceId) ?? null)
			: !hasSelectedPinFilter
				? null
				: (filteredPlaces.find((place) => place.id === activePlaceId) ??
						filteredPlaces.find((place) => place.id === activeCafeteria?.placeId) ??
						filteredPlaces[0] ??
						null)
	);

	const activeCampusSpot = $derived<CampusSpot | null>(
		campusSpots.find((spot) => spot.id === activeCampusSpotId) ?? null
	);
	const activeCampusSpotPanel = $derived(getCampusSpotPanelPresentation(activeCampusSpot));

	const mapPlaces = $derived(
		sheetMode === 'pin'
			? []
			: sheetMode === 'shuttle'
			? shuttleStops
			: sheetMode === 'facility'
			? facilityPlaces
			: sheetMode === 'place' && activePlace
			? [activePlace]
			: sheetMode === 'cafeteria'
			? data.places.filter((place) => data.cafeterias.some((cafeteria) => cafeteria.placeId === place.id))
			: filteredPlaces
	);

	const activeMapPlaceId = $derived(
		sheetMode === 'pin'
			? ''
			: sheetMode === 'shuttle'
			? (shuttleStops.find((stop) => stop.stopId === activeShuttleStopId)?.id ?? '')
			: (activePlace?.id ?? '')
	);

	const placeFocusTargetRatio = $derived(
		sheetMode === 'place' || sheetMode === 'facility' || sheetMode === 'shuttle'
			? getAvailableMapMarkerTargetRatio({
					mapHeight: mapViewportHeight,
					navigationHeight: bottomNavigationHeight,
					sheetHeight
				})
			: undefined
	);

	const activeWeeklyMenu = $derived(activeCafeteria?.weeklyMenu ?? null);
	const currentCafeteriaDate = $derived(
		data.cafeterias.find((cafeteria) => cafeteria.id === 'jinri')?.weeklyMenu?.todayDate?.replaceAll('.', '-') ?? ''
	);

	const selectedMenuDay = $derived(
		activeWeeklyMenu?.days?.find((day) => day.key === activeDayKey) ??
			activeWeeklyMenu?.days?.find((day) => day.key === activeWeeklyMenu.todayKey) ??
			activeWeeklyMenu?.days?.[0] ??
			null
	);

	const cafeteriaSummary = $derived(createCafeteriaSummary(data.cafeterias, data.todayCafeteria.summary));
	const activeMealSections = $derived(buildMealSections(activeCafeteria, selectedMenuDay));
	const upcomingShuttles = $derived(getUpcomingShuttles(currentTime, activeShuttleStopId, 5));
	const nextShuttle = $derived(getUpcomingShuttles(currentTime, undefined, 1)[0] ?? null);

	onMount(() => {
		const weatherAbortController = new AbortController();
		void loadWeather(weatherAbortController.signal);

		if (showCampusBoundaries) void loadCampusSpots();

		if (data.initialPanel === 'cafeteria') {
			openCafeteriaPanel();
		} else if (data.initialPanel === 'shuttle') {
			openShuttlePanel(data.initialShuttleStopId ?? undefined);
		} else if (data.initialPanel === 'pin') {
			openPinPanel();
		} else if (data.initialPanel === 'place' && data.initialPlaceId) {
			openPlacePanel(data.initialPlaceId);
		}

		const timer = window.setInterval(() => {
			currentTime = new Date();
		}, 30000);
		const handleViewportResize = () => syncSheetHeight();

		window.addEventListener('resize', handleViewportResize);
		window.visualViewport?.addEventListener('resize', handleViewportResize);
		requestAnimationFrame(syncSheetHeight);

		return () => {
			weatherAbortController.abort();
			window.clearInterval(timer);
			window.removeEventListener('resize', handleViewportResize);
			window.visualViewport?.removeEventListener('resize', handleViewportResize);
		};
	});

	async function loadWeather(signal: AbortSignal) {
		weatherLoading = true;
		weatherError = false;

		try {
			const url = resolveApiUrl(
				'/api/weather/current',
				publicEnv.PUBLIC_API_BASE_URL ?? ''
			);
			const response = await fetch(url, { signal });
			if (!response.ok) throw new Error('날씨 요청 실패');

			const payload: unknown = await response.json();
			if (!isWeatherSnapshot(payload)) throw new Error('날씨 응답 형식 오류');
			weather = payload;
		} catch {
			if (signal.aborted) return;
			weatherError = true;
		} finally {
			if (!signal.aborted) weatherLoading = false;
		}
	}

	$effect(() => {
		if (sheetMode !== 'cafeteria' || !activeCafeteria) return;
		selectedCategory = 'cafeteria';
		activePlaceId = activeCafeteria.placeId;
	});

	function openCafeteriaPanel() {
		sheetMode = 'cafeteria';
		setSheetDetent('expanded');
		activeCampusSpotId = '';
		focusCampusSpotId = '';
		hasSelectedPinFilter = true;
		activeCafeteriaIndex = 0;
		const firstMenu = data.cafeterias[0]?.weeklyMenu;
		activeDayKey = firstMenu?.todayKey ?? 'mon';
		expandedMealId = '';
		requestAnimationFrame(() => cafeteriaScroller?.scrollTo({ left: 0, behavior: 'smooth' }));
	}

	function openShuttlePanel(stopId?: ShuttleStopId) {
		sheetMode = 'shuttle';
		setSheetDetent('collapsed');
		activeCampusSpotId = '';
		focusCampusSpotId = '';
		selectedCategory = 'all';
		activeShuttleStopId = stopId ?? nextShuttle?.from ?? 'campus';
		homeFocusRequestId += 1;
		requestAnimationFrame(() => {
			const stopIndex = shuttleStops.findIndex((stop) => stop.stopId === activeShuttleStopId);
			shuttleScroller?.scrollTo({
				left: Math.max(0, stopIndex) * shuttleScroller.clientWidth,
				behavior: 'instant'
			});
		});
	}

	function openPinPanel() {
		sheetMode = 'pin';
		setSheetDetent('collapsed');
		hasSelectedPinFilter = true;
		selectedZone = 'all';
		selectedCategory = 'all';
		activePlaceId = '';
		showCampusBoundaries = true;
		activeCampusSpotId = '';
		focusCampusSpotId = '';
		void loadCampusSpots();
	}

	function openPlacePanel(placeId: string) {
		const place = data.places.find((item) => item.id === placeId && item.type === 'cafeteria');
		if (!place) return;
		const cafeteriaIndex = data.cafeterias.findIndex((item) => item.placeId === place.id);

		sheetMode = 'cafeteria';
		setSheetDetent('collapsed');
		hasSelectedPinFilter = true;
		activeCafeteriaIndex = Math.max(0, cafeteriaIndex);
		activePlaceId = place.id;
		activeCampusSpotId = '';
		focusCampusSpotId = '';
		homeFocusRequestId += 1;
		requestAnimationFrame(() =>
			cafeteriaScroller?.scrollTo({
				left: activeCafeteriaIndex * cafeteriaScroller.clientWidth,
				behavior: 'instant'
			})
		);
	}

	function selectFacilityCategory(categorySlug: string) {
		selectedFacilityCategory = categorySlug;
		facilitySearchQuery = '';
		openFacilityResults();
	}

	function updateFacilitySearch(query: string) {
		facilitySearchQuery = query;
		selectedFacilityCategory = 'all';
		if (query.trim()) openFacilityResults();
	}

	function openFacilityResults() {
		sheetMode = 'facility';
		setSheetDetent('collapsed');
		hasSelectedPinFilter = true;
		activeCampusSpotId = '';
		focusCampusSpotId = '';
		activePlaceId = getNextActivePlaceId(facilityPlaces, activePlaceId);
		homeFocusRequestId += 1;
		requestAnimationFrame(() => facilityScroller?.scrollTo({ left: 0, behavior: 'instant' }));
	}

	async function loadCampusSpots() {
		if (campusSpotsLoading || campusSpots.length > 0) return;
		campusSpotsLoading = true;
		campusSpotsError = '';
		try {
			const response = await fetch('/api/map/campus-spots');
			if (!response.ok) throw new Error('campus spots request failed');
			const payload = (await response.json()) as { spots?: CampusSpot[] };
			campusSpots = Array.isArray(payload.spots) ? payload.spots : [];
			if (campusSpots.length === 0) throw new Error('empty campus spots');
		} catch {
			campusSpotsError = '캠퍼스 구역 정보를 불러오지 못했습니다.';
		} finally {
			campusSpotsLoading = false;
		}
	}

	function closePanel() {
		if (sheetMode === 'place') {
			void goto('/');
			return;
		}

		sheetMode = 'home';
		setSheetDetent('collapsed');
		homeFocusRequestId += 1;
		hasSelectedPinFilter = false;
		selectedZone = 'all';
		selectedCategory = 'all';
		selectedFacilityCategory = 'all';
		facilitySearchQuery = '';
		facilitySearchOpen = false;
		activePlaceId = '';
		activeCampusSpotId = '';
		focusCampusSpotId = DEFAULT_HOME_CAMPUS_SPOT_ID;
	}

	function selectShuttleStop(stopId: ShuttleStopId) {
		activeShuttleStopId = stopId;
		const stopIndex = shuttleStops.findIndex((stop) => stop.stopId === stopId);
		shuttleScroller?.scrollTo({
			left: Math.max(0, stopIndex) * shuttleScroller.clientWidth,
			behavior: 'smooth'
		});
		homeFocusRequestId += 1;
	}

	function handleMarkerClick(placeId: string) {
		if (sheetMode === 'shuttle') {
			const stop = shuttleStops.find((item) => item.id === placeId);
			if (stop) selectShuttleStop(stop.stopId);
			return;
		}

		if (sheetMode === 'cafeteria') {
			const cafeteriaIndex = data.cafeterias.findIndex((item) => item.placeId === placeId);
			if (cafeteriaIndex >= 0) selectCafeteria(cafeteriaIndex);
			return;
		}

		if (sheetMode === 'facility') {
			selectFacilityPlace(placeId);
			return;
		}

		activePlaceId = placeId;
	}

	function selectCampusSpot(spotId: string) {
		const selectedSpot = campusSpots.find((spot) => spot.id === spotId);
		if (!selectedSpot) return;

		activeCampusSpotId = spotId;
		focusCampusSpotId = spotId;
		sheetMode = 'pin';
		setSheetDetent(getCampusSpotPanelPresentation(selectedSpot).detent);
		showCampusBoundaries = true;
	}

	function toggleCampusBoundaries() {
		showCampusBoundaries = !showCampusBoundaries;
		activeCampusSpotId = '';
		focusCampusSpotId = showCampusBoundaries ? DEFAULT_HOME_CAMPUS_SPOT_ID : '';
	}

	function selectMapArea(areaId: string) {
		const nextState = changeSelectedMapArea(areaId);
		selectedMapAreaId = areaId;
		areaMode = nextState.mode;
		selectedCommercialZoneId = nextState.selectedZoneId;
		selectedOutsideCategory = 'all';
		selectedOutsideCuisine = 'all';
		if (sheetMode === 'facility') {
			requestAnimationFrame(() => {
				activePlaceId = getNextActivePlaceId(facilityPlaces, '');
				facilityScroller?.scrollTo({ left: 0, behavior: 'instant' });
				homeFocusRequestId += 1;
			});
		}
	}

	function resetHomeMapArea() {
		const resetState = getHomeMapResetState();
		selectedMapAreaId = resetState.selectedMapAreaId;
		areaMode = resetState.areaMode;
		selectedCommercialZoneId = resetState.selectedCommercialZoneId;
		selectedOutsideCategory = resetState.selectedOutsideCategory;
		selectedOutsideCuisine = resetState.selectedOutsideCuisine;
	}

	function selectCafeteria(index: number) {
		activeCafeteriaIndex = index;
		const nextMenu = data.cafeterias[index]?.weeklyMenu;
		activeDayKey = nextMenu?.todayKey ?? activeDayKey;
		expandedMealId = '';
		cafeteriaScroller?.scrollTo({
			left: index * cafeteriaScroller.clientWidth,
			behavior: 'smooth'
		});
	}

	function handleCafeteriaScroll() {
		if (!cafeteriaScroller) return;
		const nextIndex = Math.round(cafeteriaScroller.scrollLeft / cafeteriaScroller.clientWidth);
		if (nextIndex === activeCafeteriaIndex || !data.cafeterias[nextIndex]) return;

		activeCafeteriaIndex = nextIndex;
		const nextMenu = data.cafeterias[nextIndex]?.weeklyMenu;
		activeDayKey = nextMenu?.todayKey ?? activeDayKey;
		expandedMealId = '';
	}

	function selectFacilityPlace(placeId: string) {
		const placeIndex = facilityPlaces.findIndex((place) => place.id === placeId);
		if (placeIndex < 0) return;
		activePlaceId = placeId;
		facilityScroller?.scrollTo({
			left: placeIndex * facilityScroller.clientWidth,
			behavior: 'smooth'
		});
		homeFocusRequestId += 1;
	}

	function handleFacilityScroll() {
		if (!facilityScroller) return;
		const nextIndex = Math.round(facilityScroller.scrollLeft / facilityScroller.clientWidth);
		const nextPlace = facilityPlaces[nextIndex];
		if (!nextPlace || nextPlace.id === activePlaceId) return;
		activePlaceId = nextPlace.id;
		homeFocusRequestId += 1;
	}

	function handleShuttleScroll() {
		if (!shuttleScroller) return;
		const nextIndex = Math.round(shuttleScroller.scrollLeft / shuttleScroller.clientWidth);
		const nextStop = shuttleStops[nextIndex];
		if (!nextStop || nextStop.stopId === activeShuttleStopId) return;
		activeShuttleStopId = nextStop.stopId;
		homeFocusRequestId += 1;
	}

	function selectDay(dayKey: MenuDayKey) {
		activeDayKey = dayKey;
		expandedMealId = '';
	}

	function toggleMeal(mealId: string) {
		expandedMealId = expandedMealId === mealId ? '' : mealId;
	}

	function getCurrentLayoutMetrics() {
		const viewportHeight = appShellElement?.getBoundingClientRect().height ?? window.innerHeight;
		const navigationHeight =
			document.querySelector<HTMLElement>('[data-bottom-navigation]')?.getBoundingClientRect().height ?? 73;

		return {
			viewportHeight,
			navigationHeight,
			sheetHeights: getBottomSheetHeights(viewportHeight, navigationHeight)
		};
	}

	function getCurrentSheetHeights() {
		return getCurrentLayoutMetrics().sheetHeights;
	}

	function syncSheetHeight() {
		if (typeof window === 'undefined') return;
		const { viewportHeight, navigationHeight, sheetHeights } = getCurrentLayoutMetrics();
		mapViewportHeight = viewportHeight;
		bottomNavigationHeight = navigationHeight;
		sheetHeight = sheetHeights[sheetDetent];
		weatherWidgetBottom = getWeatherWidgetBottomOffset(
			viewportHeight,
			navigationHeight,
			WEATHER_WIDGET_GAP
		);
	}

	function setSheetDetent(detent: BottomSheetDetent) {
		sheetDetent = detent;
		if (typeof window !== 'undefined') syncSheetHeight();
	}

	function cycleSheetDetent() {
		setSheetDetent(
			sheetDetent === 'expanded' ? 'collapsed' : getNextBottomSheetDetent(sheetDetent, 'up')
		);
	}

	function handleSheetPointerDown(event: PointerEvent) {
		if (event.button !== 0 || !sheetElement) return;

		activeSheetPointerId = event.pointerId;
		isSheetDragging = true;
		dragStartY = event.clientY;
		dragStartHeight = sheetElement.getBoundingClientRect().height;
		lastPointerY = event.clientY;
		lastPointerTime = performance.now();
		dragVelocityY = 0;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handleSheetPointerMove(event: PointerEvent) {
		if (!isSheetDragging || event.pointerId !== activeSheetPointerId) return;

		const now = performance.now();
		const elapsed = now - lastPointerTime;
		if (elapsed > 0) dragVelocityY = (event.clientY - lastPointerY) / elapsed;

		lastPointerY = event.clientY;
		lastPointerTime = now;
		sheetHeight = clampBottomSheetHeight(
			dragStartHeight + dragStartY - event.clientY,
			getCurrentSheetHeights()
		);
	}

	function finishSheetPointer(event: PointerEvent, cancelled = false) {
		if (!isSheetDragging || event.pointerId !== activeSheetPointerId) return;

		const handle = event.currentTarget as HTMLElement;
		if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);

		const draggedDistance = Math.abs(event.clientY - dragStartY);
		isSheetDragging = false;
		activeSheetPointerId = null;

		if (cancelled) {
			syncSheetHeight();
			return;
		}

		if (draggedDistance < 6) {
			cycleSheetDetent();
			return;
		}

		setSheetDetent(
			resolveBottomSheetDetent(
				sheetHeight,
				dragVelocityY,
				sheetDetent,
				getCurrentSheetHeights()
			)
		);
	}

	function handleSheetHandleClick(event: MouseEvent) {
		if (event.detail === 0) cycleSheetDetent();
	}

	function handleSheetHandleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowUp') {
			event.preventDefault();
			setSheetDetent(getNextBottomSheetDetent(sheetDetent, 'up'));
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			setSheetDetent(getNextBottomSheetDetent(sheetDetent, 'down'));
		} else if (event.key === 'Home') {
			event.preventDefault();
			setSheetDetent('collapsed');
		} else if (event.key === 'End') {
			event.preventDefault();
			setSheetDetent('expanded');
		}
	}

	function getSheetDetentValue() {
		if (sheetDetent === 'collapsed') return 1;
		if (sheetDetent === 'medium') return 2;
		return 3;
	}

	function getSheetDetentLabel() {
		if (sheetDetent === 'collapsed') return '최소 높이';
		if (sheetDetent === 'medium') return '중간 높이';
		return '최대 높이';
	}

	function getActiveNavigationKey(): BottomNavigationKey {
		if (sheetMode === 'shuttle') return 'shuttle';
		if (sheetMode === 'cafeteria') return 'cafeteria';
		return 'home';
	}

	function handleBottomNavigation(key: BottomNavigationKey) {
		if (key === 'home') {
			resetHomeMapArea();
			closePanel();
		}
		if (key === 'cafeteria') openCafeteriaPanel();
	}

	function formatShortDate(dateStr?: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('.');
		if (parts.length !== 3) return dateStr;
		return `${Number(parts[1])}.${Number(parts[2])}`;
	}

	function createCafeteriaSummary(cafeterias: CafeteriaPanelItem[], fallbackSummary: string) {
		const jinri = cafeterias.find((cafeteria) => cafeteria.id === 'jinri');
		const today = jinri?.weeklyMenu?.days.find((day) => day.key === jinri.weeklyMenu?.todayKey);
		const lunch = today?.student.korean?.[0] ?? today?.student.special?.[0] ?? today?.student.snack?.[0];

		if (lunch) return lunch;
		if (jinri?.weeklyMenu) return `${formatShortDate(jinri.weeklyMenu.todayDate)} 주간 식단`;
		return fallbackSummary || '주간 식단 확인';
	}

	function buildLegacyMealSections(cafeteria: CafeteriaPanelItem | null, day: DailyMenu | null): unknown[] {
		if (!cafeteria || !day || cafeteria.source !== 'crawler') return [];

		if (cafeteria.id === 'faculty') {
			return [
				{ id: 'faculty-lunch', name: '중식', items: day.faculty.lunch },
				{ id: 'faculty-dinner', name: '석식', items: day.faculty.dinner }
			];
		}

		return [
			{ id: 'student-breakfast', name: '조식', items: day.student.breakfast },
			{ id: 'student-korean', name: '한식', items: day.student.korean },
			{ id: 'student-special', name: '일품', items: day.student.special },
			{ id: 'student-snack', name: '분식', items: day.student.snack },
			{ id: 'student-dinner', name: '석식', items: day.student.dinner }
		];
	}

	function buildMealSections(cafeteria: CafeteriaPanelItem | null, day: DailyMenu | null): MealSection[] {
		if (!cafeteria || !day || cafeteria.source !== 'crawler') return [];
		const cafeteriaCode = cafeteria.id === 'faculty' ? 'faculty' : 'jinri';
		const menuDate = day.date.replaceAll('.', '-');
		const createItems = (
			mealSlot: 'breakfast' | 'lunch' | 'dinner',
			menuSection: string,
			items: string[]
		): MealItem[] =>
			items.map((name) => {
				const feedbackKey = createOfferingKey(cafeteriaCode, menuDate, mealSlot, menuSection, name);
				return { name, feedbackKey, feedback: cafeteriaFeedback[feedbackKey], mealSlot, menuDate };
			});

		if (cafeteria.id === 'faculty') {
			return [
				{ id: 'faculty-lunch', name: '중식', items: createItems('lunch', 'lunch', day.faculty.lunch) },
				{ id: 'faculty-dinner', name: '석식', items: createItems('dinner', 'dinner', day.faculty.dinner) }
			];
		}

		return [
			{ id: 'student-breakfast', name: '조식', items: createItems('breakfast', 'breakfast', day.student.breakfast) },
			{ id: 'student-korean', name: '한식', items: createItems('lunch', 'korean', day.student.korean) },
			{ id: 'student-special', name: '특식', items: createItems('lunch', 'special', day.student.special) },
			{ id: 'student-snack', name: '분식', items: createItems('lunch', 'snack', day.student.snack) },
			{ id: 'student-dinner', name: '석식', items: createItems('dinner', 'dinner', day.student.dinner) }
		];
	}

	function isVoteOpen(item: MealItem) {
		const window = getVoteWindow(item.menuDate, item.mealSlot);
		return currentTime >= window.opensAt && currentTime < window.closesAt;
	}

	function getVoteText(likes: number, dislikes: number) {
		const total = likes + dislikes;
		if (total < 3) return `평가 ${total}개`;
		return `호감 ${Math.round((likes / total) * 100)}% · ${total}개`;
	}

	async function voteForMenu(item: MealItem, reaction: 'like' | 'dislike') {
		if (!item.feedback || !item.feedback.isVotable || !isVoteOpen(item)) return;
		const response = await fetch('/api/cafeteria/votes', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ offeringId: item.feedback.offeringId, reaction })
		});
		if (!response.ok) return;

		const previousReaction = item.feedback.myReaction;
		const next = { ...item.feedback, myReaction: reaction };
		if (previousReaction !== reaction) {
			if (previousReaction === 'like') {
				next.todayLikes -= 1;
				next.historicalLikes -= 1;
			} else if (previousReaction === 'dislike') {
				next.todayDislikes -= 1;
				next.historicalDislikes -= 1;
			}
			if (reaction === 'like') {
				next.todayLikes += 1;
				next.historicalLikes += 1;
			} else {
				next.todayDislikes += 1;
				next.historicalDislikes += 1;
			}
		}
		cafeteriaFeedback = { ...cafeteriaFeedback, [item.feedbackKey]: next };
	}
</script>

<svelte:head>
	<title>골라바유 v3</title>
	<meta
		name="description"
		content="고려대 세종 학생을 위한 네이버 지도 기반 로컬 생활 플랫폼"
	/>
</svelte:head>

{#snippet MealDisclosure(meal: MealSection)}
	<div class="overflow-hidden rounded-[14px] border border-brand-border bg-white">
		<button
			class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
			type="button"
			onclick={() => toggleMeal(meal.id)}
		>
			<span class="text-sm font-black text-brand-text">{meal.name}</span>
			<span class="flex items-center gap-2 text-xs font-bold text-brand-muted">
				{meal.items.length > 0 ? `${meal.items.length}개` : '메뉴 없음'}
				{#if expandedMealId === meal.id}
					<ChevronUp size={16} strokeWidth={3} />
				{:else}
					<ChevronDown size={16} strokeWidth={3} />
				{/if}
			</span>
		</button>

		{#if expandedMealId === meal.id}
			<div class="border-t border-brand-border bg-[#fffdfd] px-4 py-3">
				{#if meal.items.length > 0}
					<ul class="grid gap-1.5">
						{#each meal.items as item}
							<li class="rounded-[10px] py-1.5 text-[13px] leading-relaxed text-brand-muted">
								<div class="flex items-center justify-between gap-3">
									<span>{item.name}</span>
									{#if item.feedback?.isVotable}
										<span class="shrink-0 text-[11px] font-bold text-brand-muted">
											오늘 {getVoteText(item.feedback.todayLikes, item.feedback.todayDislikes)}
										</span>
									{/if}
								</div>
								{#if item.feedback?.isVotable}
									<div class="mt-1 flex items-center justify-between gap-2">
										<span class="text-[11px] font-bold text-brand-muted">
											역대 {getVoteText(item.feedback.historicalLikes, item.feedback.historicalDislikes)}
										</span>
										<div class="flex gap-1">
											<button
												class={`grid h-7 w-7 place-items-center rounded-full border ${item.feedback.myReaction === 'like' ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-muted'} disabled:cursor-not-allowed disabled:opacity-45`}
												type="button"
												aria-label={`${item.name} 좋았어요`}
												disabled={!isVoteOpen(item)}
												onclick={() => voteForMenu(item, 'like')}
											>
												<ThumbsUp size={14} strokeWidth={2.8} />
											</button>
											<button
												class={`grid h-7 w-7 place-items-center rounded-full border ${item.feedback.myReaction === 'dislike' ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-muted'} disabled:cursor-not-allowed disabled:opacity-45`}
												type="button"
												aria-label={`${item.name} 아쉬웠어요`}
												disabled={!isVoteOpen(item)}
												onclick={() => voteForMenu(item, 'dislike')}
											>
												<ThumbsDown size={14} strokeWidth={2.8} />
											</button>
										</div>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="m-0 text-[13px] text-brand-muted">등록된 메뉴가 없습니다.</p>
				{/if}
			</div>
		{/if}
	</div>
{/snippet}

<main class="min-h-screen bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		bind:this={appShellElement}
		class="relative min-h-screen w-full overflow-hidden bg-brand-surface shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong"
		aria-label="골라바유 v3 지도 홈"
	>
		<NaverMap
			clientId={data.naverMapClientId}
			places={mapPlaces}
			activePlaceId={activeMapPlaceId}
			focusMode={sheetMode === 'cafeteria' || sheetMode === 'pin' ? 'top-band' : 'default'}
			focusRequestId={homeFocusRequestId}
			focusZoom={
				sheetMode === 'place' || sheetMode === 'facility' || sheetMode === 'shuttle'
					? getPlaceFocusZoom(DEFAULT_HOME_MAP_ZOOM)
					: DEFAULT_HOME_MAP_ZOOM
			}
			focusTargetRatio={placeFocusTargetRatio}
			campusSpots={campusSpots}
			activeCampusSpotId={activeCampusSpotId}
			focusCampusSpotId={focusCampusSpotId}
			showCampusBoundaries={showCampusBoundaries}
			{areaMode}
			commercialZones={data.commercialZones}
			{selectedCommercialZoneId}
			onMarkerClick={handleMarkerClick}
			onCampusSpotClick={selectCampusSpot}
		/>

		{#if sheetMode === 'home' || sheetMode === 'facility'}
			<HomeMapHeader
				zones={data.commercialZones}
				selectedAreaId={selectedMapAreaId}
				onAreaChange={selectMapArea}
				searchOpen={facilitySearchOpen}
				searchQuery={facilitySearchQuery}
				onSearchOpenChange={(open) => (facilitySearchOpen = open)}
				onSearchQueryChange={updateFacilitySearch}
			/>
			<FacilityFilterChips
				selectedCategory={selectedFacilityCategory}
				onCategoryChange={selectFacilityCategory}
			/>

			{#if data.homeNotice && sheetMode === 'home'}
				<a
					class="pointer-events-auto relative z-20 flex h-10 items-center gap-2 border-b border-brand-border bg-white px-4 text-[13px]"
					href={`/notices/${data.homeNotice.id}`}
				>
					<strong class="shrink-0 text-brand">공지</strong>
					<span class="min-w-0 flex-1 truncate font-bold text-brand-text">{data.homeNotice.title}</span>
					<span class="shrink-0 text-xs font-bold text-brand-muted">보기</span>
				</a>
			{/if}

			{#if areaMode === 'outside' && sheetMode === 'home'}
				<OutsidePlaceFilters
					selectedCategory={selectedOutsideCategory}
					selectedCuisine={selectedOutsideCuisine}
					onCategoryChange={(category) => (selectedOutsideCategory = category)}
					onCuisineChange={(cuisine) => (selectedOutsideCuisine = cuisine)}
				/>
			{/if}
		{/if}

		<WeatherWidget
			{weather}
			loading={weatherLoading}
			error={weatherError}
			bottom={weatherWidgetBottom}
		/>

		<section
			bind:this={sheetElement}
			class={`pointer-events-auto absolute inset-x-0 z-20 flex overflow-hidden rounded-t-[26px] bg-brand-surface/95 px-[18px] pb-5 shadow-[0_-18px_40px_rgba(103,16,43,0.16)] backdrop-blur ${
				isSheetDragging ? '' : 'transition-[height] duration-300 ease-out'
			}`}
			style={`bottom: var(--bottom-navigation-height); height: ${sheetHeight}px;`}
			aria-label="오늘의 생활 정보"
		>
			<div class="flex min-h-0 w-full flex-col">
				<button
					class="group -mx-1 flex h-9 shrink-0 touch-none cursor-grab items-center justify-center rounded-full active:cursor-grabbing focus-visible:outline-none"
					type="button"
					role="slider"
					aria-label="바텀시트 높이 조절"
					aria-valuemin="1"
					aria-valuemax="3"
					aria-valuenow={getSheetDetentValue()}
					aria-valuetext={getSheetDetentLabel()}
					onpointerdown={handleSheetPointerDown}
					onpointermove={handleSheetPointerMove}
					onpointerup={(event) => finishSheetPointer(event)}
					onpointercancel={(event) => finishSheetPointer(event, true)}
					onclick={handleSheetHandleClick}
					onkeydown={handleSheetHandleKeydown}
				>
					<span class="h-1 w-[42px] rounded-full bg-[#dcc3ca] outline-offset-4 group-focus-visible:outline-2 group-focus-visible:outline-brand"></span>
				</button>

			{#if sheetMode === 'home'}
				<div class="mb-3 grid grid-cols-3 gap-2">
					<a
						class="grid min-h-16 content-center gap-1 rounded-[14px] border border-brand-border bg-white p-2.5 text-left"
						href="/cafeteria"
					>
						<span class="flex items-center gap-1.5 text-[13px] font-black">
							<Utensils size={15} strokeWidth={2.8} />
							오늘 학식
						</span>
						<span class="text-xs leading-snug text-brand-muted">{cafeteriaSummary}</span>
					</a>
					<a
						class="grid min-h-16 content-center gap-1 rounded-[14px] border border-brand-border bg-white p-2.5 text-left"
						href="/shuttle"
					>
						<span class="flex items-center gap-1.5 text-[13px] font-black">
							<Bus size={15} strokeWidth={2.8} />
							다음 셔틀
						</span>
						<span class="text-xs leading-snug text-brand-muted">
							{#if nextShuttle}
								{formatMinutesLeft(nextShuttle.minutesLeft)} · {nextShuttle.departureTime}
							{:else}
								오늘 운행 종료
							{/if}
						</span>
					</a>
					<a
						class="grid min-h-16 content-center gap-1 rounded-[14px] border border-brand-border bg-white p-2.5"
						href="/meetups"
					>
						<span class="flex items-center gap-1.5 text-[13px] font-black">
							<Users size={15} strokeWidth={2.8} />
							모임
						</span>
						<span class="text-xs leading-snug text-brand-muted">점심 번개 열기</span>
					</a>
				</div>

				{#if activePlace}
					<article class="flex items-center justify-between gap-4 rounded-[18px] bg-brand-dark p-4 text-white">
						<div>
							<p class="m-0 text-xs font-black text-[#f4c7d4]">{activePlace.categoryName}</p>
							<h2 class="mt-1 text-[19px] font-black">{activePlace.name}</h2>
							<span class="mt-1.5 block text-[13px] leading-snug text-[#f7dfe6]">
								{activePlace.description}
							</span>
						</div>
						<a
							class="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2.5 text-[13px] font-black text-brand-dark"
							href={`/places/${activePlace.id}`}
						>
							<MapPin size={15} strokeWidth={3} />
							자세히
						</a>
					</article>
				{:else}
					<p class="m-0 pt-3 text-center text-sm text-brand-muted">
						{hasSelectedPinFilter
							? '선택한 조건에 맞는 장소가 아직 없습니다.'
							: '카테고리를 선택하면 지도에 핀이 표시됩니다.'}
					</p>
				{/if}
			{:else if sheetMode === 'facility'}
				<div class="flex min-h-0 flex-1 flex-col">
					<div class="mb-2 flex items-center justify-between gap-3">
						<div>
							<p class="m-0 text-xs font-bold text-brand-muted">
								{areaMode === 'campus' ? '교내 시설' : '교외 시설'} · {facilityPlaces.length}곳
							</p>
							<h2 class="m-0 mt-0.5 text-[18px] font-black">
								{activeFacilityPlace?.categoryName ?? '검색 결과'}
							</h2>
						</div>
						<button
							class="px-1 py-2 text-[13px] font-bold text-brand-muted"
							type="button"
							onclick={closePanel}
						>
							닫기
						</button>
					</div>

					{#if facilityPlaces.length > 0}
						<div
							bind:this={facilityScroller}
							class="-mx-[18px] flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
							onscroll={handleFacilityScroll}
						>
							{#each facilityPlaces as place}
								<article class="w-full shrink-0 snap-center px-[18px]" aria-label={place.name}>
									<div class="flex items-start gap-3 border-y border-brand-border py-3">
										<span
											class="mt-0.5 inline-block h-6 w-6 shrink-0 bg-brand"
											style={`mask:url('/24 icon/${place.icon}.svg') center/contain no-repeat;-webkit-mask:url('/24 icon/${place.icon}.svg') center/contain no-repeat;`}
										></span>
										<div class="min-w-0 flex-1">
											<h3 class="m-0 text-[16px] font-black">{place.name}</h3>
											{#if place.locationGuide}
												<p class="m-0 mt-1 text-[13px] font-bold text-brand-muted">{place.locationGuide}</p>
											{/if}
											{#if place.description}
												<p class="m-0 mt-2 text-[13px] leading-relaxed text-brand-text">{place.description}</p>
											{/if}
											<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-muted">
												{#if place.operatingHours}<span>{place.operatingHours}</span>{/if}
												{#if place.phone}<a class="font-bold text-brand" href={`tel:${place.phone}`}>{place.phone}</a>{/if}
											</div>
										</div>
									</div>
								</article>
							{/each}
						</div>

						{#if facilityPlaces.length > 1}
							<div class="mt-3 flex justify-center gap-1.5">
								{#each facilityPlaces as place}
									<button
										class={`h-2 rounded-full transition-all ${activePlaceId === place.id ? 'w-6 bg-brand' : 'w-2 bg-brand-border-strong'}`}
										type="button"
										aria-label={`${place.name} 보기`}
										onclick={() => selectFacilityPlace(place.id)}
									></button>
								{/each}
							</div>
						{/if}
					{:else}
						<p class="m-0 border-y border-brand-border py-6 text-center text-sm font-bold text-brand-muted">
							조건에 맞는 시설이 아직 없습니다.
						</p>
					{/if}
				</div>
			{:else if sheetMode === 'cafeteria'}
				<div class="flex min-h-0 flex-1 flex-col">
					<div class="mb-3 flex items-center justify-between gap-3">
						<div>
							<p class="m-0 text-xs font-black text-brand-muted">오늘의 학식</p>
							<h2 class="m-0 mt-0.5 text-xl font-black">{activeCafeteria?.name}</h2>
						</div>
						<button
							class="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-black text-brand-muted"
							type="button"
							onclick={closePanel}
						>
							닫기
						</button>
					</div>

					<div
						bind:this={cafeteriaScroller}
						class="-mx-[18px] flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						onscroll={handleCafeteriaScroll}
					>
						{#each data.cafeterias as cafeteria}
							<section class="w-full shrink-0 snap-center px-[18px]" aria-label={cafeteria.name}>
								<div class="rounded-[18px] border border-brand-border bg-white p-4">
									<div class="flex items-start justify-between gap-3">
										<div>
											<h3 class="m-0 text-[18px] font-black">{cafeteria.name}</h3>
											<p class="m-0 mt-1 text-[13px] leading-snug text-brand-muted">
												{cafeteria.description}
											</p>
										</div>
										<span class="shrink-0 rounded-full bg-brand-map px-2.5 py-1 text-[11px] font-black text-brand">
											{cafeteria.source === 'crawler' ? '주간' : '상시'}
										</span>
									</div>
								</div>
							</section>
						{/each}
					</div>

					<div class="my-3 flex justify-center gap-1.5">
						{#each data.cafeterias as cafeteria, index}
							<button
								class={`h-2.5 rounded-full transition-all ${
									activeCafeteriaIndex === index ? 'w-6 bg-brand' : 'w-2.5 bg-brand-border-strong'
								}`}
								type="button"
								aria-label={`${cafeteria.name} 보기`}
								onclick={() => selectCafeteria(index)}
							></button>
						{/each}
					</div>

					<div class="min-h-0 flex-1 overflow-y-auto pb-2">
						{#if activeCafeteria?.source === 'crawler' && activeWeeklyMenu}
							<div class="sticky top-0 z-10 mb-3 grid grid-cols-5 gap-1 rounded-[14px] bg-brand-surface/95 py-1 backdrop-blur">
								{#each activeWeeklyMenu.days as day}
									<button
										class={`rounded-[12px] px-2 py-2 text-xs font-black transition ${
											activeDayKey === day.key
												? 'bg-brand text-white shadow-[0_8px_18px_rgba(138,21,56,0.2)]'
												: 'bg-white text-brand-muted'
										}`}
										type="button"
										onclick={() => selectDay(day.key)}
									>
										{day.day}
									</button>
								{/each}
							</div>

							<div class="mb-3 flex items-center justify-between rounded-[14px] bg-brand-map px-4 py-3">
								<span class="text-sm font-black">
									{formatShortDate(selectedMenuDay?.date)} ({selectedMenuDay?.day})
								</span>
								<span class="text-xs font-bold text-brand-muted">눌러서 메뉴 펼치기</span>
							</div>

							<div class="grid gap-2.5">
								{#each activeMealSections as meal}
									{@render MealDisclosure(meal)}
								{/each}
							</div>
						{:else if activeCafeteria?.source === 'static'}
							<div class="grid gap-2.5">
								{#each activeCafeteria.staticVendors ?? [] as vendor}
									<div class="rounded-[14px] border border-brand-border bg-white px-4 py-3">
										<div class="flex items-center justify-between gap-3">
											<h3 class="m-0 text-sm font-black">{vendor.name}</h3>
											<span class="rounded-full bg-brand-map px-2.5 py-1 text-[11px] font-black text-brand-muted">
												준비 중
											</span>
										</div>
										<div class="mt-3 grid gap-2">
											{#each vendor.menus as menu}
												{@const feedbackKey = createOfferingKey('foodcourt', currentCafeteriaDate, 'all_day', vendor.id, menu.name)}
												{@const feedback = cafeteriaFeedback[feedbackKey]}
												{@const item: MealItem = { name: menu.name, feedbackKey, feedback, mealSlot: 'all_day', menuDate: currentCafeteriaDate }}
												<div class="rounded-[10px] bg-brand-map px-3 py-2">
													<div class="flex items-center justify-between gap-3">
														<span class="text-[13px] font-black text-brand-text">{menu.name}</span>
														<span class="text-xs font-bold text-brand-muted">{menu.price.toLocaleString()}원</span>
													</div>
													{#if feedback?.isVotable}
														<div class="mt-1 flex items-center justify-between gap-2">
															<span class="text-[11px] font-bold text-brand-muted">오늘 {getVoteText(feedback.todayLikes, feedback.todayDislikes)} · 역대 {getVoteText(feedback.historicalLikes, feedback.historicalDislikes)}</span>
															<div class="flex gap-1">
																<button class={`grid h-7 w-7 place-items-center rounded-full border ${feedback.myReaction === 'like' ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-muted'} disabled:opacity-45`} type="button" aria-label={`${menu.name} 좋았어요`} disabled={!isVoteOpen(item)} onclick={() => voteForMenu(item, 'like')}><ThumbsUp size={14} strokeWidth={2.8} /></button>
																<button class={`grid h-7 w-7 place-items-center rounded-full border ${feedback.myReaction === 'dislike' ? 'border-brand bg-brand text-white' : 'border-brand-border bg-white text-brand-muted'} disabled:opacity-45`} type="button" aria-label={`${menu.name} 아쉬웠어요`} disabled={!isVoteOpen(item)} onclick={() => voteForMenu(item, 'dislike')}><ThumbsDown size={14} strokeWidth={2.8} /></button>
															</div>
														</div>
													{/if}
												</div>
											{/each}
										</div>
										<p class="m-0 mt-2 text-[13px] text-brand-muted">
											고정 메뉴 정보는 아직 비워두었습니다.
										</p>
									</div>
								{/each}
							</div>
						{:else}
							<div class="rounded-[18px] border border-brand-border bg-white px-5 py-8 text-center">
								<p class="m-0 text-sm font-bold text-brand-muted">
									이번 주 학식 정보를 아직 불러오지 못했습니다.
								</p>
							</div>
						{/if}
					</div>
				</div>
			{:else if sheetMode === 'place' && activePlace}
				<div class="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pb-2">
					<div class="flex items-start justify-between gap-3 rounded-[16px] bg-brand-dark p-4 text-white">
						<div>
							<p class="m-0 text-xs font-black text-[#f4c7d4]">{activePlace.categoryName}</p>
							<h2 class="m-0 mt-1 text-[19px] font-black">{activePlace.name}</h2>
							<p class="m-0 mt-1.5 text-[13px] leading-snug text-[#f7dfe6]">{activePlace.description}</p>
						</div>
						<button class="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-brand-dark" type="button" onclick={closePanel}>닫기</button>
					</div>
				</div>
			{:else if sheetMode === 'pin'}
				<div class="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pb-2">
					<div class="flex items-center justify-between gap-3">
						<h2 class="m-0 text-xl font-black">{activeCampusSpotPanel.title}</h2>
						<button
							class="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-black text-brand-muted"
							type="button"
							onclick={closePanel}
						>
							닫기
						</button>
					</div>
					{#if false}
						<div class="flex items-center justify-between gap-3 rounded-[8px] border border-brand-border bg-white px-4 py-3">
						<div class="flex items-center gap-2.5">
							<div class="grid h-9 w-9 place-items-center rounded-[8px] bg-brand-map text-brand">
								<MapPin size={19} strokeWidth={2.8} />
							</div>
							<div>
								<p class="m-0 text-sm font-black">구역 표시</p>
								<p class="m-0 mt-0.5 text-xs font-bold text-brand-muted">건물 · 광장 · 주요 지점</p>
							</div>
						</div>
						<button
							class={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
								showCampusBoundaries ? 'bg-brand' : 'bg-brand-border-strong'
							}`}
							type="button"
							role="switch"
							aria-checked={showCampusBoundaries}
							aria-label="캠퍼스 구역 표시"
							onclick={toggleCampusBoundaries}
						>
							<span
								class={`absolute top-1 grid h-5 w-5 place-items-center rounded-full bg-white shadow-sm transition-transform ${
									showCampusBoundaries ? 'translate-x-6' : 'translate-x-1'
								}`}
							></span>
						</button>
						</div>
					{/if}

					{#if !activeCampusSpot && campusSpotsLoading}
						<p class="m-0 px-1 pt-1 text-sm font-bold leading-6 text-brand-muted">
							캠퍼스 구역을 불러오는 중입니다.
						</p>
					{:else if !activeCampusSpot && campusSpotsError}
						<p class="m-0 px-1 pt-1 text-sm font-bold leading-6 text-brand-muted">
							{campusSpotsError}
						</p>
					{:else if !activeCampusSpot}
						<p class="m-0 px-1 pt-1 text-sm font-bold leading-6 text-brand-muted">
							구역을 켜고 지도 위 건물이나 광장을 눌러보세요.
						</p>
					{/if}
				</div>
			{:else}
				<div class="flex min-h-0 flex-1 flex-col">
					<div class="mb-3 flex items-center justify-between gap-3">
						<div>
							<p class="m-0 text-xs font-black text-brand-muted">셔틀 정류장</p>
							<h2 class="m-0 mt-0.5 text-xl font-black">
								{shuttleStops.find((stop) => stop.stopId === activeShuttleStopId)?.name}
							</h2>
						</div>
						<button
							class="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-black text-brand-muted"
							type="button"
							onclick={closePanel}
						>
							닫기
						</button>
					</div>

					<div
						bind:this={shuttleScroller}
						class="-mx-[18px] mb-3 flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						onscroll={handleShuttleScroll}
					>
						{#each shuttleStops as stop}
							<section class="w-full shrink-0 snap-center px-[18px]" data-shuttle-map-spot>
								<div class="flex items-start gap-3 border-y border-brand-border py-4">
									<div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-map text-brand">
										<MapPin size={18} strokeWidth={2.8} />
									</div>
									<div>
										<p class="m-0 text-[13px] font-bold leading-relaxed text-brand-muted">{stop.description}</p>
										<a class="mt-3 inline-flex items-center gap-1 text-sm font-black text-brand" href={`/shuttle?stop=${stop.stopId}`}>
											상세보기
											<ChevronDown class="-rotate-90" size={15} strokeWidth={3} />
										</a>
									</div>
								</div>
							</section>
						{/each}
					</div>

					<div class="mb-3 flex justify-center gap-1.5">
						{#each shuttleStops as stop}
							<button
								class={`h-2 rounded-full transition-all ${activeShuttleStopId === stop.stopId ? 'w-6 bg-brand' : 'w-2 bg-brand-border-strong'}`}
								type="button"
								aria-label={`${stop.name} 보기`}
								onclick={() => selectShuttleStop(stop.stopId)}
							></button>
						{/each}
					</div>

					<div class="hidden">
						{#each shuttleStops as stop}
							<button
								class={`rounded-[14px] border px-3 py-3 text-left transition ${
									activeShuttleStopId === stop.stopId
										? 'border-brand bg-brand text-white shadow-[0_10px_24px_rgba(138,21,56,0.2)]'
										: 'border-brand-border bg-white text-brand-text'
								}`}
								type="button"
								onclick={() => selectShuttleStop(stop.stopId)}
							>
								<span class="block text-[13px] font-black">{stop.name}</span>
								<span
									class={`mt-1 block text-xs ${
										activeShuttleStopId === stop.stopId ? 'text-white/80' : 'text-brand-muted'
									}`}
								>
									{stop.stopId === 'campus' ? '조치원역 방향' : '학교 방향'}
								</span>
							</button>
						{/each}
					</div>

					<div class="hidden">
						<div class="mb-2 flex items-center justify-between px-1">
							<h3 class="m-0 text-sm font-black">이후 출발</h3>
							<span class="text-xs font-bold text-brand-muted">평일 기준 · {shuttleSchedules.length}회</span>
						</div>

						{#if upcomingShuttles.length > 0}
							<div class="grid gap-2">
								{#each upcomingShuttles as shuttle}
									<div class="rounded-[14px] border border-brand-border bg-white px-4 py-3">
										<div class="flex items-center justify-between gap-3">
											<div>
												<p class="m-0 text-sm font-black">
													{shuttle.departureTime}
													<span class="text-brand-muted"> · {shuttle.toName} 방향</span>
												</p>
												<p class="m-0 mt-1 text-xs font-bold text-brand-muted">
													{shuttle.fromName} 출발
												</p>
											</div>
											<div class="flex shrink-0 items-center gap-1.5">
												{#if shuttle.tag}
													<span class="rounded-full bg-brand-map px-2 py-1 text-[11px] font-black text-brand">
														{shuttle.tag === 'first' ? '첫차' : '막차'}
													</span>
												{/if}
												<span class="rounded-full bg-brand-dark px-2.5 py-1 text-xs font-black text-white">
													{formatMinutesLeft(shuttle.minutesLeft)}
												</span>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="rounded-[18px] border border-brand-border bg-white px-5 py-8 text-center">
								<p class="m-0 text-sm font-bold text-brand-muted">
									오늘 남은 셔틀이 없습니다.
								</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
			</div>
		</section>

		<BottomNavigation
			activeKey={getActiveNavigationKey()}
			containerClass="absolute inset-x-0 bottom-0 z-30"
			isAuthenticated={Boolean(data.user)}
			onNavigate={handleBottomNavigation}
		/>
	</section>
</main>
