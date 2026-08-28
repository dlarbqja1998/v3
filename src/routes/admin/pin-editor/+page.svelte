<script module lang="ts">
	export function shouldHydratePinEditorDraft(hydratedPinId: string, selectedPinId: string) {
		return hydratedPinId !== selectedPinId;
	}

	export function getPinEditorLeaveGuard(
		hasUnsavedChanges: boolean,
		allowNextNavigation: boolean,
		willUnload: boolean
	): 'allow' | 'dialog' | 'native' {
		if (!hasUnsavedChanges || allowNextNavigation) return 'allow';
		return willUnload ? 'native' : 'dialog';
	}

	export function getSavedPinsForEditor<T extends { id: string }>(
		pins: T[],
		selectedPinId: string
	) {
		return selectedPinId ? pins.filter((pin) => pin.id !== selectedPinId) : pins;
	}
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate, goto } from '$app/navigation';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { ArrowLeft, MapPin, Plus, Save, Trash2 } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { isFacilityCategorySlug, type FacilityCategorySlug } from '$lib/domain/facility-categories';
	import { findContainingZoneId } from '$lib/domain/facility-zone';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let selectedPinId = $state(untrack(() => data.selectedPinId || data.pins[0]?.id || ''));
	let name = $state('');
	let scope = $state<'campus' | 'outside'>('campus');
	let categorySlug = $state<FacilityCategorySlug>(
		untrack(() => data.categories[0]?.slug ?? 'convenience-store')
	);
	let zoneId = $state('');
	let latitude = $state(36.6095);
	let longitude = $state(127.287);
	let hasCoordinate = $state(false);
	let locationGuide = $state('');
	let description = $state('');
	let operatingHours = $state('');
	let phone = $state('');
	let displayPriority = $state(0);
	let isVisible = $state(true);
	let mapElement: HTMLDivElement;
	let map: any;
	let draftMarker: any;
	let savedMarkers: any[] = [];
	let loadError = $state('');
	let hydratedPinId = $state('');
	let hasUnsavedChanges = $state(false);
	let allowNextNavigation = $state(false);
	let showLeaveDialog = $state(false);
	let pendingNavigationUrl = $state('');
	let isSaving = $state(false);
	let saveForm: HTMLFormElement;

	const selectedCategory = $derived(
		data.categories.find((category) => category.slug === categorySlug) ?? data.categories[0]
	);
	const selectedPin = $derived(data.pins.find((pin) => pin.id === selectedPinId) ?? null);

	$effect(() => {
		const pin = selectedPin;
		if (!pin) {
			hydratedPinId = '';
			return;
		}
		if (!shouldHydratePinEditorDraft(hydratedPinId, pin.id)) return;
		hydratedPinId = pin.id;
		untrack(() => {
			name = pin.name;
			scope = pin.scope === 'outside' ? 'outside' : 'campus';
			categorySlug = isFacilityCategorySlug(pin.categorySlug)
				? pin.categorySlug
				: 'convenience-store';
			zoneId = pin.zoneId ?? '';
			latitude = pin.latitude;
			longitude = pin.longitude;
			hasCoordinate = true;
			locationGuide = pin.locationGuide ?? '';
			description = pin.description;
			operatingHours = pin.operatingHours ?? '';
			phone = pin.phone ?? '';
			displayPriority = pin.displayPriority;
			isVisible = pin.isVisible;
			hasUnsavedChanges = false;
			refreshDraftMarker(true);
		});
	});

	$effect(() => {
		selectedPinId;
		renderSavedMarkers();
	});

	beforeNavigate((navigation) => {
		const guard = getPinEditorLeaveGuard(
			hasUnsavedChanges,
			allowNextNavigation,
			navigation.willUnload
		);
		if (guard === 'allow') {
			allowNextNavigation = false;
			return;
		}
		navigation.cancel();
		if (guard === 'native') return;
		pendingNavigationUrl = navigation.to?.url.href ?? '';
		showLeaveDialog = true;
	});

	onMount(() => void initializeMap());
	onDestroy(clearMarkers);

	function startNewPin() {
		selectedPinId = '';
		hydratedPinId = '';
		name = '';
		scope = 'campus';
		categorySlug = data.categories[0]?.slug ?? 'convenience-store';
		zoneId = '';
		hasCoordinate = false;
		locationGuide = '';
		description = '';
		operatingHours = '';
		phone = '';
		displayPriority = Math.max(0, ...data.pins.map((pin) => pin.displayPriority + 1));
		isVisible = true;
		hasUnsavedChanges = false;
		refreshDraftMarker(false);
	}

	function changeScope(nextScope: 'campus' | 'outside') {
		scope = nextScope;
		if (scope === 'campus') zoneId = '';
		else if (hasCoordinate) inferZone();
		markDirty();
	}

	function inferZone() {
		zoneId =
			findContainingZoneId(
				{ latitude, longitude },
				data.zones.map((zone) => ({ id: zone.id, boundary: zone.boundary }))
			) ?? '';
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
				center: new naver.maps.LatLng(latitude, longitude),
				zoom: 16,
				minZoom: 12,
				maxZoom: 21,
				mapDataControl: false,
				scaleControl: false,
				zoomControl: true
			});
			naver.maps.Event.addListener(map, 'click', ({ coord }: any) => {
				setCoordinate(coord.lat(), coord.lng());
			});
			renderSavedMarkers();
			refreshDraftMarker(Boolean(selectedPin));
		} catch {
			loadError = '네이버 지도를 불러오지 못했습니다.';
		}
	}

	function setCoordinate(nextLatitude: number, nextLongitude: number) {
		latitude = nextLatitude;
		longitude = nextLongitude;
		hasCoordinate = true;
		if (scope === 'outside') inferZone();
		markDirty();
		refreshDraftMarker(false);
	}

	function markDirty() {
		hasUnsavedChanges = true;
	}

	function closeLeaveDialog() {
		showLeaveDialog = false;
		pendingNavigationUrl = '';
	}

	async function leaveWithoutSaving() {
		const destination = pendingNavigationUrl;
		if (!destination) return;
		showLeaveDialog = false;
		allowNextNavigation = true;
		await goto(destination);
	}

	function saveBeforeLeaving() {
		saveForm?.requestSubmit();
	}

	const enhanceSaveForm: SubmitFunction = () => {
		isSaving = true;
		const destination = pendingNavigationUrl;
		return async ({ result, update }) => {
			isSaving = false;
			if (result.type === 'success' || result.type === 'redirect') {
				hasUnsavedChanges = false;
				showLeaveDialog = false;
				pendingNavigationUrl = '';
				allowNextNavigation = true;
				if (destination) {
					await goto(destination);
					return;
				}
			} else {
				showLeaveDialog = false;
				pendingNavigationUrl = '';
			}
			await update();
		};
	};

	function refreshDraftMarker(shouldFocus: boolean) {
		if (!map || !window.naver) return;
		draftMarker?.setMap(null);
		if (!hasCoordinate) return;
		const naver = window.naver as any;
		const position = new naver.maps.LatLng(latitude, longitude);
		draftMarker = new naver.maps.Marker({
			map,
			position,
			draggable: true,
			zIndex: 200,
			icon: { content: markerContent(selectedCategory?.icon ?? '', true), anchor: new naver.maps.Point(22, 44) }
		});
		naver.maps.Event.addListener(draftMarker, 'dragend', ({ coord }: any) => {
			setCoordinate(coord.lat(), coord.lng());
		});
		if (shouldFocus) map.panTo(position);
	}

	function renderSavedMarkers() {
		if (!map || !window.naver) return;
		for (const marker of savedMarkers) marker.setMap(null);
		const naver = window.naver as any;
		savedMarkers = getSavedPinsForEditor(data.pins, selectedPinId).map((pin) => {
			const marker = new naver.maps.Marker({
				map,
				position: new naver.maps.LatLng(pin.latitude, pin.longitude),
				icon: { content: markerContent(pin.icon, pin.id === selectedPinId), anchor: new naver.maps.Point(20, 40) }
			});
			naver.maps.Event.addListener(marker, 'click', () => (selectedPinId = pin.id));
			return marker;
		});
	}

	function markerContent(icon: string, active: boolean) {
		return `<button type="button" aria-label="시설 핀" style="width:40px;height:40px;border-radius:20px 20px 20px 4px;transform:rotate(-45deg);border:2px solid white;background:${active ? '#5f0f2d' : '#a51c45'};box-shadow:0 4px 12px rgba(0,0,0,.2);display:grid;place-items:center"><span style="width:20px;height:20px;transform:rotate(45deg);background:white;mask:url('/24 icon/${icon}.svg') center/contain no-repeat;-webkit-mask:url('/24 icon/${icon}.svg') center/contain no-repeat"></span></button>`;
	}

	function clearMarkers() {
		draftMarker?.setMap(null);
		for (const marker of savedMarkers) marker.setMap(null);
		savedMarkers = [];
	}

	function confirmDelete(event: SubmitEvent) {
		if (!selectedPin || window.confirm(`“${selectedPin.name}” 핀을 영구 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
		event.preventDefault();
	}

	function loadNaverMapScript(clientId: string) {
		if (window.naver?.maps) return Promise.resolve();
		const existing = document.querySelector<HTMLScriptElement>('script[data-naver-map-sdk]');
		if (existing) return new Promise<void>((resolve, reject) => {
			existing.addEventListener('load', () => resolve(), { once: true });
			existing.addEventListener('error', () => reject(), { once: true });
		});
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
</script>

<svelte:head><title>지도 핀 편집 | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text">
	<section class="mx-auto grid min-h-dvh w-full max-w-7xl md:grid-cols-[340px_1fr]">
		<aside class="order-2 z-20 grid max-h-[72dvh] content-start gap-4 overflow-y-auto border-t border-brand-border bg-white p-4 pb-[calc(24px+env(safe-area-inset-bottom))] md:order-1 md:max-h-dvh md:border-r md:border-t-0 md:p-5">
			<header class="flex items-center justify-between gap-3">
				<div>
					<p class="m-0 text-xs font-black text-brand-muted">관리자</p>
					<h1 class="m-0 mt-1 text-lg font-black">지도 핀 편집</h1>
				</div>
				<a class="grid h-11 w-11 place-items-center text-brand" href="/my" aria-label="마이로 돌아가기"><ArrowLeft size={20} /></a>
			</header>

			<div class="grid grid-cols-2 border-b border-brand-border" aria-label="시설 범위">
				{#each ['campus', 'outside'] as value}
					<button class={`h-11 border-b-2 text-sm font-black ${scope === value ? 'border-brand text-brand' : 'border-transparent text-brand-muted'}`} type="button" onclick={() => changeScope(value as 'campus' | 'outside')}>{value === 'campus' ? '교내' : '교외'}</button>
				{/each}
			</div>

			<div class="flex items-center justify-between gap-2">
				<label class="min-w-0 flex-1 text-sm font-bold">기존 핀
					<select class="mt-1 w-full border-b border-brand-border px-1 py-2" bind:value={selectedPinId}>
						<option value="">새 핀</option>
						{#each data.pins.filter((pin) => pin.scope === scope) as pin}<option value={pin.id}>{pin.name}</option>{/each}
					</select>
				</label>
				<button class="mt-5 flex h-10 items-center gap-1 px-2 text-sm font-black text-brand" type="button" onclick={startNewPin}><Plus size={16} />새 핀</button>
			</div>

			<form bind:this={saveForm} method="POST" action="?/savePin" class="grid gap-4" oninput={markDirty} use:enhance={enhanceSaveForm}>
				<input type="hidden" name="id" value={selectedPinId} />
				<input type="hidden" name="scope" value={scope} />
				<input type="hidden" name="latitude" value={hasCoordinate ? latitude : ''} />
				<input type="hidden" name="longitude" value={hasCoordinate ? longitude : ''} />

				<label class="grid gap-1 text-sm font-bold">시설명<input class="h-11 border-b border-brand-border px-1" name="name" maxlength="120" bind:value={name} required /></label>
				<label class="grid gap-1 text-sm font-bold">카테고리
					<select class="h-11 border-b border-brand-border px-1" name="categorySlug" bind:value={categorySlug} onchange={() => refreshDraftMarker(false)}>
						{#each data.categories as category}<option value={category.slug}>{category.name}</option>{/each}
					</select>
				</label>

				<div class="flex items-center gap-4 border-y border-brand-border py-3">
					<span class="text-sm font-bold text-brand-muted">아이콘 미리보기</span>
					{#if selectedCategory}
						<img src={`/20 icon/${selectedCategory.icon}.svg`} alt="20px 미리보기" width="20" height="20" />
						<img src={`/24 icon/${selectedCategory.icon}.svg`} alt="24px 미리보기" width="24" height="24" />
					{/if}
				</div>

				{#if scope === 'outside'}
					<label class="grid gap-1 text-sm font-bold">상권 구역
						<select class="h-11 border-b border-brand-border px-1" name="zoneId" bind:value={zoneId} required>
							<option value="">구역 선택</option>
							{#each data.zones as zone}<option value={zone.id}>{zone.name}</option>{/each}
						</select>
					</label>
			{/if}

				<label class="grid gap-1 text-sm font-bold">위치 안내<input class="h-11 border-b border-brand-border px-1" name="locationGuide" maxlength="160" placeholder="예: 학생회관 1층" bind:value={locationGuide} required /></label>
				<label class="grid gap-1 text-sm font-bold">설명<textarea class="min-h-20 border border-brand-border p-2" name="description" bind:value={description}></textarea></label>
				<label class="grid gap-1 text-sm font-bold">운영시간<input class="h-11 border-b border-brand-border px-1" name="operatingHours" maxlength="240" placeholder="예: 평일 09:00~18:00" bind:value={operatingHours} /></label>
				<label class="grid gap-1 text-sm font-bold">전화번호<input class="h-11 border-b border-brand-border px-1" name="phone" maxlength="40" inputmode="tel" bind:value={phone} /></label>
				<label class="grid gap-1 text-sm font-bold">바텀시트 표시 순서<input class="h-11 border-b border-brand-border px-1" name="displayPriority" type="number" min="0" max="9999" bind:value={displayPriority} /></label>
				<label class="flex min-h-12 items-center justify-between gap-4 border-y border-brand-border py-2 text-sm font-black">지도에 표시<input class="h-5 w-10 accent-brand" name="isVisible" type="checkbox" bind:checked={isVisible} /></label>

				<p class="m-0 text-xs font-bold text-brand-muted">지도를 눌러 핀을 만들고, 마커를 드래그해 위치를 조정하세요.</p>
				<button class="flex h-12 items-center justify-center gap-2 bg-brand text-sm font-black text-white disabled:opacity-40" type="submit" disabled={!hasCoordinate || !name.trim() || !locationGuide.trim()}><Save size={17} />핀 저장</button>
				{#if form?.saveError}<p class="m-0 text-sm font-bold text-red-700">{form.saveError}</p>{/if}
				{#if data.saved}<p class="m-0 text-sm font-bold text-emerald-700">핀을 저장했습니다.</p>{/if}
			</form>

			{#if selectedPin}
				<form method="POST" action="?/deletePin" onsubmit={confirmDelete}>
					<input type="hidden" name="id" value={selectedPin.id} />
					<button class="flex h-11 w-full items-center justify-center gap-2 text-sm font-bold text-red-700" type="submit"><Trash2 size={16} />영구 삭제</button>
				</form>
			{/if}
			<a class="text-center text-sm font-bold text-brand-muted" href="/admin/boundary-editor"><MapPin size={15} class="inline" /> 구역 에디터 열기</a>
		</aside>

		<section class="relative order-1 min-h-[48dvh] bg-brand-map md:order-2 md:min-h-dvh">
			<div class="absolute inset-0"><div bind:this={mapElement} class="h-full w-full"></div></div>
			{#if loadError}<p class="absolute inset-0 grid place-items-center bg-white/90 p-6 text-center text-sm font-bold text-brand-muted">{loadError}</p>{/if}
		</section>
	</section>

	{#if showLeaveDialog}
		<div class="fixed inset-0 z-[1000] grid place-items-end bg-black/45 p-4 pb-[max(16px,env(safe-area-inset-bottom))] md:place-items-center" role="presentation">
			<div class="w-full max-w-[430px] bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
				<h2 id="leave-dialog-title" class="m-0 text-base font-black">저장하지 않은 수정사항이 있습니다</h2>
				<p class="m-0 mt-2 text-sm leading-6 text-brand-muted">페이지를 나가기 전에 수정한 핀 정보를 저장할까요?</p>
				<div class="mt-5 grid gap-2">
					<button class="h-12 bg-brand text-sm font-black text-white disabled:opacity-50" type="button" disabled={isSaving} onclick={saveBeforeLeaving}>{isSaving ? '저장 중…' : '저장 후 나가기'}</button>
					<button class="h-11 border-b border-brand-border text-sm font-bold text-red-700" type="button" disabled={isSaving} onclick={leaveWithoutSaving}>저장하지 않고 나가기</button>
					<button class="h-11 text-sm font-bold text-brand-muted" type="button" disabled={isSaving} onclick={closeLeaveDialog}>계속 편집</button>
				</div>
			</div>
		</div>
	{/if}
</main>
