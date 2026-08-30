<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { ChevronDown, ChevronRight, ChevronUp, Clock3, MapPin, Pencil, Plus, Trash2 } from '@lucide/svelte';

	import {
		getCafeteriaOperatingStatus,
		type CafeteriaOperatingHour
	} from '$lib/domain/cafeteria-operating-hours';
	import type { CafeteriaPanelItem, DailyMenu, MenuDayKey } from '$lib/domain/places';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import LifestylePageHeader from '$lib/navigation/LifestylePageHeader.svelte';
	import type { ActionData, PageData } from './$types';

	type MealSection = { id: string; name: string; items: string[] };
	type OperatingHourDraft = Pick<CafeteriaOperatingHour, 'label' | 'daysOfWeek' | 'opensAt' | 'closesAt'>;

	const weekdays = [
		{ value: 1, label: '월' },
		{ value: 2, label: '화' },
		{ value: 3, label: '수' },
		{ value: 4, label: '목' },
		{ value: 5, label: '금' },
		{ value: 6, label: '토' },
		{ value: 0, label: '일' }
	];

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let activeCafeteriaIndex = $state(0);
	let activeDayKey = $state<MenuDayKey>('mon');
	let expandedMealId = $state('');
	let currentTime = $state(new Date());
	let isOperatingHoursOpen = $state(false);
	let isEditingOperatingHours = $state(false);
	let operatingHourDrafts = $state<OperatingHourDraft[]>([]);
	let operatingHoursPayload = $state('');
	let operatingHours = $state<CafeteriaOperatingHour[]>([]);
	let operatingHoursLoading = $state(false);
	let operatingHoursError = $state('');
	let operatingHoursLoadedFor = $state('');

	const activeCafeteria = $derived(data.cafeterias[activeCafeteriaIndex] ?? data.cafeterias[0] ?? null);
	const activeWeeklyMenu = $derived(activeCafeteria?.weeklyMenu ?? null);
	const selectedMenuDay = $derived(
		activeWeeklyMenu?.days.find((day) => day.key === activeDayKey) ??
			activeWeeklyMenu?.days.find((day) => day.key === activeWeeklyMenu?.todayKey) ??
			activeWeeklyMenu?.days[0] ??
			null
	);
	const activeMeals = $derived(buildMealSections(activeCafeteria, selectedMenuDay));
	const activeOperatingHours = $derived(
		operatingHours.filter((row) => row.cafeteriaCode === activeCafeteria?.id)
	);
	const operatingStatus = $derived(getCafeteriaOperatingStatus(activeOperatingHours, currentTime));
	const cafeteriaTabWidth = $derived(data.cafeterias.length > 0 ? 100 / data.cafeterias.length : 0);

	onMount(() => {
		const timer = window.setInterval(() => (currentTime = new Date()), 30000);
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeOperatingHours();
		};
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.clearInterval(timer);
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	function selectCafeteria(index: number) {
		activeCafeteriaIndex = index;
		activeDayKey = data.cafeterias[index]?.weeklyMenu?.todayKey ?? 'mon';
		expandedMealId = '';
	}

	function selectDay(dayKey: MenuDayKey) {
		activeDayKey = dayKey;
		expandedMealId = '';
	}

	function toggleMeal(mealId: string) {
		expandedMealId = expandedMealId === mealId ? '' : mealId;
	}

	async function openOperatingHours() {
		isOperatingHoursOpen = true;
		isEditingOperatingHours = false;
		operatingHoursError = '';
		if (!activeCafeteria || operatingHoursLoadedFor === activeCafeteria.id) return;

		operatingHoursLoading = true;
		try {
			const response = await fetch(
				`/api/cafeteria/operating-hours?cafeteria=${encodeURIComponent(activeCafeteria.id)}`
			);
			if (!response.ok) throw new Error('운영시간 요청 실패');

			const payload: unknown = await response.json();
			if (!hasOperatingHours(payload)) throw new Error('운영시간 응답 형식 오류');

			operatingHours = payload.operatingHours;
			operatingHoursLoadedFor = activeCafeteria.id;
		} catch (error) {
			console.error('학식 운영시간을 불러오지 못했습니다.', error);
			operatingHoursError = '운영시간을 불러오지 못했습니다. 다시 시도해 주세요.';
		} finally {
			operatingHoursLoading = false;
		}
	}

	function closeOperatingHours() {
		isOperatingHoursOpen = false;
		isEditingOperatingHours = false;
	}

	function startOperatingHoursEdit() {
		operatingHourDrafts = activeOperatingHours.map((row) => ({
			label: row.label,
			daysOfWeek: [...row.daysOfWeek],
			opensAt: row.opensAt,
			closesAt: row.closesAt
		}));
		isEditingOperatingHours = true;
	}

	function addOperatingHour() {
		if (operatingHourDrafts.length >= 8) return;
		operatingHourDrafts = [
			...operatingHourDrafts,
			{ label: '중식', daysOfWeek: [1, 2, 3, 4, 5], opensAt: '11:30', closesAt: '13:30' }
		];
	}

	function removeOperatingHour(index: number) {
		operatingHourDrafts = operatingHourDrafts.filter((_, draftIndex) => draftIndex !== index);
	}

	function toggleDraftDay(index: number, day: number) {
		const draft = operatingHourDrafts[index];
		if (!draft) return;
		const daysOfWeek = draft.daysOfWeek.includes(day)
			? draft.daysOfWeek.filter((value) => value !== day)
			: [...draft.daysOfWeek, day].sort((a, b) => a - b);
		operatingHourDrafts = operatingHourDrafts.map((value, draftIndex) =>
			draftIndex === index ? { ...value, daysOfWeek } : value
		);
	}

	function prepareOperatingHoursSubmit() {
		if (!activeCafeteria) return;
		operatingHoursPayload = JSON.stringify({
			cafeteriaCode: activeCafeteria.id,
			rows: operatingHourDrafts
		});
	}

	function viewOnMap() {
		if (!activeCafeteria) return;
		void goto(`/?panel=place&place=${activeCafeteria.placeId}`);
	}

	function formatOperatingDays(daysOfWeek: number[]) {
		if (daysOfWeek.length === 5 && [1, 2, 3, 4, 5].every((day) => daysOfWeek.includes(day))) {
			return '평일';
		}
		return weekdays.filter((day) => daysOfWeek.includes(day.value)).map((day) => day.label).join(' · ');
	}

	function formatShortDate(dateStr?: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('.');
		return parts.length === 3 ? `${Number(parts[1])}.${Number(parts[2])}` : dateStr;
	}

	function getCafeteriaSelectorLabel(cafeteria: CafeteriaPanelItem) {
		if (cafeteria.id === 'jinri') return '진리관';
		if (cafeteria.id === 'faculty') return '교직원';
		return '푸드코트';
	}

	function hasOperatingHours(value: unknown): value is { operatingHours: CafeteriaOperatingHour[] } {
		return !!value && typeof value === 'object' && Array.isArray((value as { operatingHours?: unknown }).operatingHours);
	}

	function buildMealSections(cafeteria: CafeteriaPanelItem | null, day: DailyMenu | null): MealSection[] {
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
			{ id: 'student-snack', name: '분식', items: day.student.snack },
			{ id: 'student-dinner', name: '석식', items: day.student.dinner }
		];
	}
</script>

<svelte:head>
	<title>학식 | 골라바유</title>
	<meta name="description" content="고려대 세종캠퍼스 학식과 운영시간을 확인하세요." />
</svelte:head>

<main class="min-h-[100dvh] bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="relative min-h-[100dvh] w-full bg-brand-surface pb-[calc(var(--bottom-navigation-height)+20px)] shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border"
		aria-label="학식"
	>
		<LifestylePageHeader title="오늘, 학식" closeLabel="학식 닫기" />

		<div class="px-5 py-5">
			<div class="relative flex border-b border-brand-border" aria-label="식당 선택" data-cafeteria-tabs>
				{#each data.cafeterias as cafeteria, index}
					<button
						class={`relative z-10 flex min-h-13 flex-1 items-center justify-center px-1 py-3 text-center text-[15px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/25 ${
							activeCafeteriaIndex === index
								? 'font-black text-brand'
								: 'font-bold text-brand-muted'
						}`}
						type="button"
						aria-pressed={activeCafeteriaIndex === index}
						onclick={() => selectCafeteria(index)}
					>
						{getCafeteriaSelectorLabel(cafeteria)}
					</button>
				{/each}
				<span
					class="pointer-events-none absolute bottom-[-1px] left-0 h-0.5 bg-brand transition-[transform,width] duration-300 ease-out"
					data-cafeteria-tab-indicator
					aria-hidden="true"
					style={`width: ${cafeteriaTabWidth}%; transform: translateX(${activeCafeteriaIndex * 100}%);`}
				></span>
			</div>

			{#if activeCafeteria}
				<div class="mt-4">
					{#if activeCafeteria.source === 'crawler' && activeWeeklyMenu}
						<div class="grid grid-cols-5 gap-1 py-1" data-cafeteria-day-tabs>
							{#each activeWeeklyMenu.days as day}
								<button class={`grid min-h-12 place-items-center rounded-[10px] px-1 py-1 text-[11px] font-black ${activeDayKey === day.key ? 'text-brand' : 'text-brand-muted'}`} type="button" onclick={() => selectDay(day.key)}>
									<span class={`grid h-9 w-9 place-items-center rounded-full text-s leading-none pt-px ${activeDayKey === day.key ? 'bg-brand text-white shadow-sm' : 'text-brand-muted'}`} data-cafeteria-day-label>{day.day}</span>
								</button>
							{/each}
						</div>
					{/if}

					<div
						class={`flex min-h-11 items-center ${
							activeCafeteria.source === 'crawler' && selectedMenuDay
								? 'justify-between'
								: 'justify-end'
						} border-b border-brand-border py-1`}
						data-cafeteria-utility-row
					>
						{#if activeCafeteria.source === 'crawler' && selectedMenuDay}
							<h2 class="m-0 text-[17px] font-black tracking-[-0.02em]" data-cafeteria-date>
								{formatShortDate(selectedMenuDay.date)} ({selectedMenuDay.day})
							</h2>
						{/if}
						<div class="flex shrink-0 items-center gap-1" role="group" aria-label="학식 동작" data-cafeteria-actions>
							<button
								class="flex min-h-11 items-center gap-1 whitespace-nowrap px-1.5 text-[13px] font-bold text-brand transition-colors hover:text-brand-deep"
								type="button"
								onclick={viewOnMap}
								data-cafeteria-map-action
							>
								<MapPin size={13} strokeWidth={2.4} /> 지도에서 보기 <ChevronRight size={14} strokeWidth={2.4} />
							</button>
							<button class="flex min-h-11 items-center gap-1 whitespace-nowrap px-1.5 text-[13px] font-bold text-brand-muted/70" type="button" onclick={openOperatingHours}>
								<Clock3 size={13} strokeWidth={2.8} /> 운영시간
							</button>
						</div>
					</div>

					{#if activeCafeteria.source === 'crawler' && activeWeeklyMenu}
						<div class="divide-y divide-brand-border" data-cafeteria-meal-list>
							{#each activeMeals as meal}
								{@const isExpanded = expandedMealId === meal.id}
								<div class={`overflow-hidden transition-colors duration-200 ${isExpanded ? 'bg-brand-map' : ''}`}>
									<button
										class="flex w-full items-center justify-between px-1 py-4 text-left"
										type="button"
										aria-expanded={isExpanded}
										aria-controls={`cafeteria-meal-${meal.id}`}
										aria-label={`${meal.name} 메뉴 ${isExpanded ? '접기' : '펼치기'}`}
										onclick={() => toggleMeal(meal.id)}
									>
										<span class="flex items-center gap-2.5">
											<span class="h-[18px] w-1 shrink-0 rounded-full bg-brand" data-cafeteria-list-pin aria-hidden="true"></span>
											<h3 class="m-0 text-[15px] font-bold tracking-[-0.015em]" data-cafeteria-meal-title>{meal.name}</h3>
										</span>
										<span class={`grid h-6 w-6 place-items-center rounded-full text-brand-muted transition-colors ${isExpanded ? 'bg-white text-brand' : ''}`} aria-hidden="true">
											{#if isExpanded}<ChevronUp size={18} strokeWidth={2.8} />{:else}<ChevronDown size={18} strokeWidth={2.8} />{/if}
										</span>
									</button>
									{#if isExpanded}
										<div id={`cafeteria-meal-${meal.id}`} class="px-7 pb-4" role="region" aria-label={`${meal.name} 메뉴`}>
											{#if meal.items.length > 0}<ul class="m-0 grid list-none gap-2 p-0">{#each meal.items as item}<li class="text-[13px] leading-relaxed text-brand-muted">{item}</li>{/each}</ul>{:else}<p class="m-0 text-[13px] text-brand-muted">등록된 메뉴가 없습니다.</p>{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{:else if activeCafeteria.source === 'static'}
						<div class="divide-y divide-brand-border">
							{#each activeCafeteria.staticVendors ?? [] as vendor}
								<section class="py-5 first:pt-0">
									<h3 class="m-0 text-sm font-black">{vendor.name}</h3>
									<ul class="m-0 mt-3 divide-y divide-brand-border list-none p-0">{#each vendor.menus as menu}<li class="flex items-center justify-between py-2.5 text-[13px]"><span>{menu.name}</span><span class="font-bold text-brand-muted">{menu.price.toLocaleString()}원</span></li>{/each}</ul>
								</section>
							{/each}
						</div>
					{:else}
						<p class="m-0 py-9 text-center text-sm font-bold text-brand-muted">이번 주 학식 정보를 아직 불러오지 못했습니다.</p>
					{/if}
				</div>
			{/if}
		</div>

		<BottomNavigation activeKey="cafeteria" containerClass="fixed inset-x-0 bottom-0 z-40 md:left-1/2 md:w-[min(100%,430px)] md:-translate-x-1/2" isAuthenticated={Boolean(data.user)} />
	</section>
</main>

{#if isOperatingHoursOpen && activeCafeteria}
	<div class="fixed inset-0 z-50 grid place-items-end p-0 md:place-items-center md:p-5">
		<button class="absolute inset-0 bg-black/45" type="button" aria-label="운영시간 닫기" onclick={closeOperatingHours}></button>
		<div class="relative max-h-[min(78dvh,680px)] w-full overflow-hidden rounded-t-[26px] bg-brand-surface shadow-[0_-18px_42px_rgba(42,10,20,0.28)] md:max-w-[430px] md:rounded-[26px]" role="dialog" aria-modal="true" aria-label={`${activeCafeteria.name} 운영시간`}>
			<div class="flex items-center justify-between border-b border-brand-border px-5 py-4">
				<div><p class="m-0 text-xs font-black text-brand-muted">{activeCafeteria.name}</p><h2 class="m-0 mt-0.5 text-xl font-black">운영시간</h2></div>
				<button class="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-black text-brand-muted" type="button" onclick={closeOperatingHours}>닫기</button>
			</div>
			<div class="max-h-[calc(min(78dvh,680px)-76px)] overflow-y-auto px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-4">
				{#if form?.operatingHoursError || operatingHoursError}
					<p class="m-0 mb-3 rounded-[12px] bg-[#fdecee] px-3 py-2.5 text-sm font-bold text-[#a4273f]">{form?.operatingHoursError ?? operatingHoursError}</p>
				{/if}
				{#if operatingHoursLoading}
					<p class="m-0 rounded-[15px] bg-brand-map px-4 py-5 text-center text-sm font-bold text-brand-muted">운영시간을 불러오는 중이에요.</p>
				{:else if operatingHoursError}
					<button class="flex w-full items-center justify-center rounded-[14px] bg-brand-map px-4 py-3 text-sm font-black text-brand" type="button" onclick={openOperatingHours}>다시 시도</button>
				{:else if !isEditingOperatingHours}
					<div class={`mb-4 flex items-center justify-between rounded-[14px] px-4 py-3 ${operatingStatus.kind === 'open' ? 'bg-[#e4f6ec] text-[#147344]' : 'bg-brand-map text-brand-muted'}`}><span class="text-sm font-black">현재 상태</span><span class="text-sm font-black">{operatingStatus.label}</span></div>
					{#if activeOperatingHours.length > 0}
						<div class="grid gap-2.5">{#each activeOperatingHours as row}<div class="flex items-center justify-between gap-3 rounded-[14px] border border-brand-border bg-white px-4 py-3"><div><p class="m-0 text-sm font-black">{row.label}</p><p class="m-0 mt-1 text-xs font-bold text-brand-muted">{formatOperatingDays(row.daysOfWeek)}</p></div><strong class="shrink-0 text-sm">{row.opensAt} – {row.closesAt}</strong></div>{/each}</div>
					{:else}
						<p class="m-0 rounded-[15px] bg-brand-map px-4 py-5 text-center text-sm font-bold text-brand-muted">운영시간 정보가 아직 없어요.</p>
					{/if}
					{#if data.canEditOperatingHours}
						<button class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-[14px] bg-brand px-4 py-3 text-sm font-black text-white" type="button" onclick={startOperatingHoursEdit}><Pencil size={16} strokeWidth={2.8} /> 운영시간 수정</button>
					{/if}
				{:else}
					<form method="POST" action="?/saveOperatingHours" use:enhance onsubmit={prepareOperatingHoursSubmit}>
						<input type="hidden" name="operatingHours" bind:value={operatingHoursPayload} />
						<div class="grid gap-3">
							{#each operatingHourDrafts as draft, index}
								<div class="rounded-[15px] border border-brand-border bg-white p-3.5">
									<div class="flex items-center gap-2"><input class="min-w-0 flex-1 rounded-[9px] border border-brand-border px-3 py-2 text-sm font-black" aria-label={`운영 항목 ${index + 1}`} bind:value={draft.label} maxlength="40" /><button class="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border border-brand-border text-brand-muted" type="button" aria-label={`${draft.label} 삭제`} onclick={() => removeOperatingHour(index)}><Trash2 size={16} /></button></div>
									<div class="mt-3 grid grid-cols-7 gap-1">{#each weekdays as day}<button class={`h-8 rounded-[8px] text-xs font-black ${draft.daysOfWeek.includes(day.value) ? 'bg-brand text-white' : 'bg-brand-map text-brand-muted'}`} type="button" aria-pressed={draft.daysOfWeek.includes(day.value)} onclick={() => toggleDraftDay(index, day.value)}>{day.label}</button>{/each}</div>
									<div class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2"><input class="min-w-0 rounded-[9px] border border-brand-border px-2 py-2 text-center text-sm" type="time" aria-label={`${draft.label} 시작 시간`} bind:value={draft.opensAt} /><span class="text-brand-muted">–</span><input class="min-w-0 rounded-[9px] border border-brand-border px-2 py-2 text-center text-sm" type="time" aria-label={`${draft.label} 종료 시간`} bind:value={draft.closesAt} /></div>
								</div>
							{/each}
						</div>
						{#if operatingHourDrafts.length < 8}<button class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-brand-border-strong px-4 py-3 text-sm font-black text-brand" type="button" onclick={addOperatingHour}><Plus size={17} strokeWidth={2.8} /> 운영시간 추가</button>{/if}
						<div class="mt-4 grid grid-cols-2 gap-2"><button class="rounded-[14px] border border-brand-border bg-white px-4 py-3 text-sm font-black" type="button" onclick={() => (isEditingOperatingHours = false)}>취소</button><button class="rounded-[14px] bg-brand px-4 py-3 text-sm font-black text-white" type="submit">저장</button></div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}
