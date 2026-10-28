<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { onMount, tick, untrack } from 'svelte';
	import { ChevronRight, Pencil, Plus, Trash2 } from '@lucide/svelte';
	import {
		createOfferingKey,
		getWeeklyVoteAvailability,
		type CafeteriaMealSlot,
		type MenuReaction,
		type OfferingFeedbackSummary
	} from '$lib/domain/cafeteria-feedback';

	import {
		mergeSavedCafeteriaOperatingHours,
		type CafeteriaOperatingHour,
		type ValidCafeteriaOperatingHoursInput
	} from '$lib/domain/cafeteria-operating-hours';
	import { getCafeteriaMapHref, getInitialCafeteriaIndex } from '$lib/domain/cafeterias';
	import type { CafeteriaPanelItem, DailyMenu, MenuDayKey } from '$lib/domain/places';
	import { analyticsEvents } from '$lib/analytics/events';
	import { track } from '$lib/analytics/posthog.client';
	import LifestylePageHeader from '$lib/navigation/LifestylePageHeader.svelte';
	import CafeteriaMenuVoteRow from './CafeteriaMenuVoteRow.svelte';
	import type { ActionData, PageData } from './$types';

	type MealSection = {
		id: string;
		name: string;
		items: string[];
		mealSlot: CafeteriaMealSlot;
		menuSection: string;
	};
	type MenuFeedback = OfferingFeedbackSummary & { offeringId: string; isVotable: boolean };
	type CafeteriaFeedbackMap = Record<string, MenuFeedback>;
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

	let { data, form, embedded = false, active = true, onMap }: { data: PageData; form: ActionData; embedded?: boolean; active?: boolean; onMap?: (href: string) => void } = $props();
	$effect(() => { if (!active) { isOperatingHoursOpen = false; isLoginPromptOpen = false; } });
	const initialCafeteriaIndex = untrack(() =>
		getInitialCafeteriaIndex(data.cafeterias, data.initialCafeteriaId)
	);
	let activeCafeteriaIndex = $state(initialCafeteriaIndex);
	let activeDayKey = $state<MenuDayKey>(
		untrack(() => {
			const weekly = data.cafeterias[initialCafeteriaIndex]?.weeklyMenu;
			const requested = data.initialDayKey as MenuDayKey | null | undefined;
			return requested && weekly?.days.some((day) => day.key === requested)
				? requested
				: (weekly?.todayKey ?? 'mon');
		})
	);
	let expandedMealId = $state('');
	let isOperatingHoursOpen = $state(false);
	let operatingHoursButton = $state<HTMLButtonElement>();
	let operatingHoursDialog = $state<HTMLDivElement>();
	let operatingHoursController: AbortController | undefined;
	let isEditingOperatingHours = $state(false);
	let operatingHourDrafts = $state<OperatingHourDraft[]>([]);
	let operatingHoursPayload = $state('');
	let operatingHours = $state<CafeteriaOperatingHour[]>([]);
	let operatingHoursLoading = $state(false);
	let operatingHoursError = $state('');
	let operatingHoursLoadedFor = $state('');
	let isSavingOperatingHours = $state(false);
	let cafeteriaFeedback = $state<CafeteriaFeedbackMap>(
		untrack(() => ({ ...((data.cafeteriaFeedback ?? {}) as CafeteriaFeedbackMap) }))
	);
	let submittingOfferingIds = $state<string[]>([]);
	let feedbackLoading = $state(false);
	let feedbackError = $state('');
	let feedbackController: AbortController | undefined;
	let feedbackLoadedAt = 0;
	let isLoginPromptOpen = $state(false);
	let toastMessage = $state('');
	let toastTimer: number | undefined;

	const activeCafeteria = $derived(data.cafeterias[activeCafeteriaIndex] ?? data.cafeterias[0] ?? null);
	const activeWeeklyMenu = $derived(activeCafeteria?.weeklyMenu ?? null);
	const selectedMenuDay = $derived(
		activeWeeklyMenu?.days.find((day) => day.key === activeDayKey) ??
			activeWeeklyMenu?.days.find((day) => day.key === activeWeeklyMenu?.todayKey) ??
			activeWeeklyMenu?.days[0] ??
			null
	);
	const activeMeals = $derived(buildMealSections(activeCafeteria, selectedMenuDay));
	const hasMenuItems = $derived(activeMeals.some((meal) => meal.items.length > 0));
	const activeOperatingHours = $derived(
		operatingHours.filter((row) => row.cafeteriaCode === activeCafeteria?.id)
	);
	const hasOnlyWeekdayHours = $derived(
		activeOperatingHours.length > 0 &&
			activeOperatingHours.every((row) => row.daysOfWeek.every((day) => day >= 1 && day <= 5))
	);
	const loginReturnUrl = $derived(
		`/cafeteria?cafeteria=${encodeURIComponent(activeCafeteria?.id ?? 'jinri')}&day=${encodeURIComponent(activeDayKey)}`
	);
	const loginHref = $derived(`/login?next=${encodeURIComponent(loginReturnUrl)}`);

	$effect(() => {
		if (!isOperatingHoursOpen) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = previousOverflow; };
	});

	$effect(() => {
		if (active) untrack(() => { if (Date.now() - feedbackLoadedAt >= 60_000) void loadFeedback(); });
	});

	onMount(() => {
		track(analyticsEvents.openCafeteria, {
			source: 'cafeteria_page',
			cafeteria_id: activeCafeteria?.id
		});
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeOperatingHours();
			if (event.key === 'Escape') isLoginPromptOpen = false;
		};
		window.addEventListener('keydown', handleKeydown);
		return () => {
			feedbackController?.abort();
			feedbackController = undefined;
			operatingHoursController?.abort();
			if (toastTimer) window.clearTimeout(toastTimer);
			window.removeEventListener('keydown', handleKeydown);
		};
	});

	async function loadFeedback() {
		feedbackController?.abort();
		const controller = new AbortController();
		feedbackController = controller;
		feedbackLoading = true;
		feedbackError = '';
		const timeout = window.setTimeout(() => controller.abort(), 12_000);
		try {
			const response = await fetch('/api/cafeteria/feedback', { signal: controller.signal });
			const payload = await response.json();
			if (!response.ok || !payload.feedback || typeof payload.feedback !== 'object') {
				throw new Error('평가 응답 오류');
			}
			if (feedbackController === controller) { cafeteriaFeedback = payload.feedback; feedbackLoadedAt = Date.now(); }
		} catch {
			if (feedbackController === controller) feedbackError = '평가를 불러오지 못했어요.';
		} finally {
			window.clearTimeout(timeout);
			if (feedbackController === controller) feedbackLoading = false;
		}
	}

	function selectCafeteria(index: number) {
		const cafeteria = data.cafeterias[index];
		if (cafeteria) {
			track(analyticsEvents.selectCafeteria, {
				cafeteria_id: cafeteria.id,
				source: 'cafeteria_page'
			});
		}
		activeCafeteriaIndex = index;
		activeDayKey = data.cafeterias[index]?.weeklyMenu?.todayKey ?? 'mon';
		expandedMealId = '';
	}

	function selectDay(dayKey: MenuDayKey) {
		track(analyticsEvents.selectMealDate, {
			cafeteria_id: activeCafeteria?.id,
			day_key: dayKey,
			source: 'cafeteria_page'
		});
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
		void tick().then(() => operatingHoursDialog?.focus({ preventScroll: true }));
		const cafeteriaCode = activeCafeteria?.id;
		if (!cafeteriaCode || operatingHoursLoadedFor === cafeteriaCode) return;
		operatingHoursController?.abort();
		const controller = new AbortController();
		operatingHoursController = controller;

		operatingHoursLoading = true;
		try {
			const response = await fetch(
				`/api/cafeteria/operating-hours?cafeteria=${encodeURIComponent(cafeteriaCode)}`,
				{ signal: controller.signal }
			);
			if (!response.ok) throw new Error('운영시간 요청 실패');

			const payload: unknown = await response.json();
			if (!hasOperatingHours(payload)) throw new Error('운영시간 응답 형식 오류');

			if (operatingHoursController === controller) {
				operatingHours = payload.operatingHours;
				operatingHoursLoadedFor = cafeteriaCode;
			}
		} catch (error) {
			if (controller.signal.aborted || operatingHoursController !== controller) return;
			console.error('학식 운영시간을 불러오지 못했습니다.', error);
			operatingHoursError = '운영시간을 불러오지 못했습니다. 다시 시도해 주세요.';
		} finally {
			if (operatingHoursController === controller) operatingHoursLoading = false;
		}
	}

	function closeOperatingHours() {
		if (!isOperatingHoursOpen) return;
		isOperatingHoursOpen = false;
		isEditingOperatingHours = false;
		void tick().then(() => operatingHoursButton?.focus({ preventScroll: true }));
	}

	function handleOperatingHoursKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !operatingHoursDialog) return;
		const controls = [...operatingHoursDialog.querySelectorAll<HTMLElement>(
			'button:not(:disabled), input:not([type="hidden"]):not(:disabled), a[href]'
		)].filter((element) => element.getClientRects().length > 0);
		const first = controls[0];
		const last = controls[controls.length - 1];
		if (event.shiftKey && (document.activeElement === first || document.activeElement === operatingHoursDialog)) {
			event.preventDefault();
			last?.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first?.focus();
		}
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

	const enhanceOperatingHours: SubmitFunction = ({ formData, cancel }) => {
		if (!activeCafeteria || isSavingOperatingHours) {
			cancel();
			return;
		}

		formData.set(
			'operatingHours',
			JSON.stringify({
				cafeteriaCode: activeCafeteria.id,
				rows: operatingHourDrafts
			})
		);
		isSavingOperatingHours = true;
		return async ({ result, update }) => {
			try {
				if (embedded && (result.type === 'success' || result.type === 'failure')) form = result.data as ActionData;
				else await update({ reset: false, invalidateAll: false });
				if (result.type === 'success' && hasOperatingHoursSaveResult(result.data)) {
					operatingHours = mergeSavedCafeteriaOperatingHours(
						operatingHours,
						result.data.operatingHoursSaved
					);
					operatingHoursLoadedFor = result.data.operatingHoursSaved.cafeteriaCode;
					operatingHoursError = '';
					isEditingOperatingHours = false;
					showToast(result.data.operatingHoursMessage ?? '운영시간을 저장했어요.');
				}
			} finally {
				isSavingOperatingHours = false;
			}
		};
	};

	function hasOperatingHoursSaveResult(
		value: unknown
	): value is {
		operatingHoursSaved: ValidCafeteriaOperatingHoursInput;
		operatingHoursMessage?: string;
	} {
		if (!value || typeof value !== 'object') return false;
		const saved = (value as { operatingHoursSaved?: unknown }).operatingHoursSaved;
		if (!saved || typeof saved !== 'object') return false;
		const input = saved as { cafeteriaCode?: unknown; rows?: unknown };
		return (
			(input.cafeteriaCode === 'jinri' ||
				input.cafeteriaCode === 'faculty' ||
				input.cafeteriaCode === 'foodcourt') &&
			Array.isArray(input.rows)
		);
	}

	function viewOnMap() {
		if (!activeCafeteria) return;
		track(analyticsEvents.clickPlaceDetail, {
			place_id: activeCafeteria.placeId,
			cafeteria_id: activeCafeteria.id,
			action: 'view_on_map'
		});
		const href = getCafeteriaMapHref({ id: activeCafeteria.placeId });
		if (onMap) onMap(href); else void goto(href);
	}

	function showToast(message: string) {
		toastMessage = message;
		if (toastTimer) window.clearTimeout(toastTimer);
		toastTimer = window.setTimeout(() => (toastMessage = ''), 2400);
	}

	function getMenuFeedbackKey(meal: MealSection, menuName: string) {
		if (!activeCafeteria || !selectedMenuDay) return '';
		return createOfferingKey(
			activeCafeteria.id,
			selectedMenuDay.date.replaceAll('.', '-'),
			meal.mealSlot,
			meal.menuSection,
			menuName
		);
	}

	async function voteForMenu(feedbackKey: string, feedback: MenuFeedback | undefined, reaction: MenuReaction) {
		if (!feedback || submittingOfferingIds.includes(feedback.offeringId)) return;
		submittingOfferingIds = [...submittingOfferingIds, feedback.offeringId];
		try {
			const response = await fetch('/api/cafeteria/votes', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ offeringId: feedback.offeringId, reaction })
			});
			const payload: unknown = await response.json();
			if (response.status === 401) {
				isLoginPromptOpen = true;
				return;
			}
			if (!response.ok || !isVoteResponse(payload)) {
				showToast(getVoteError(payload));
				return;
			}
			cafeteriaFeedback = { ...cafeteriaFeedback, [feedbackKey]: payload.feedback };
			track(analyticsEvents.menuReactionChanged, {
				cafeteria_id: activeCafeteria?.id,
				offering_id: feedback.offeringId,
				reaction: payload.feedback.myReaction ?? 'cancel'
			});
		} catch (error) {
			console.error('학식 메뉴 평가 요청 실패:', error);
			showToast('평가를 저장하지 못했어요. 다시 시도해 주세요.');
		} finally {
			submittingOfferingIds = submittingOfferingIds.filter((id) => id !== feedback.offeringId);
		}
	}

	function isVoteResponse(value: unknown): value is { feedback: MenuFeedback } {
		if (!value || typeof value !== 'object') return false;
		const feedback = (value as { feedback?: unknown }).feedback;
		return !!feedback && typeof feedback === 'object' && typeof (feedback as MenuFeedback).offeringId === 'string';
	}

	function getVoteError(value: unknown) {
		if (value && typeof value === 'object' && typeof (value as { error?: unknown }).error === 'string') {
			return (value as { error: string }).error;
		}
		return '평가를 저장하지 못했어요. 다시 시도해 주세요.';
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
		if (cafeteria.id === 'jinri') return '진리관 학생 식당';
		if (cafeteria.id === 'faculty') return '미래관 교직원 식당';
		return cafeteria.name;
	}

	function getCafeteriaDescription(cafeteria: CafeteriaPanelItem) {
		if (cafeteria.id === 'jinri') return '진리관 학생 식당의 조식, 중식, 석식 메뉴를 확인할 수 있어요.';
		if (cafeteria.id === 'faculty') return '미래관 교직원 식당의 중식 메뉴를 확인할 수 있어요.';
		return cafeteria.description;
	}

	function hasOperatingHours(value: unknown): value is { operatingHours: CafeteriaOperatingHour[] } {
		return !!value && typeof value === 'object' && Array.isArray((value as { operatingHours?: unknown }).operatingHours);
	}

	function buildMealSections(cafeteria: CafeteriaPanelItem | null, day: DailyMenu | null): MealSection[] {
		if (!cafeteria || !day || cafeteria.source !== 'crawler') return [];
		if (cafeteria.id === 'faculty') {
			return [
				{ id: 'faculty-lunch', name: '중식', items: day.faculty.lunch, mealSlot: 'lunch', menuSection: 'lunch' }
			];
		}
		return [
			{ id: 'student-breakfast', name: '조식', items: day.student.breakfast, mealSlot: 'breakfast', menuSection: 'breakfast' },
			{ id: 'student-korean', name: '한식', items: day.student.korean, mealSlot: 'lunch', menuSection: 'korean' },
			{ id: 'student-special', name: '일품', items: day.student.special, mealSlot: 'lunch', menuSection: 'special' },
			{ id: 'student-snack', name: '분식', items: day.student.snack, mealSlot: 'lunch', menuSection: 'snack' },
			{ id: 'student-dinner', name: '석식', items: day.student.dinner, mealSlot: 'dinner', menuSection: 'dinner' }
		];
	}
</script>

<svelte:head>{#if active && !embedded}
	<title>학식 | 골라바유</title>
	<meta name="description" content="고려대 세종캠퍼스 학식과 운영시간을 확인하세요." />
{/if}</svelte:head>

<main class:embedded class="cafeteria-screen min-h-[100dvh] bg-brand-bg md:grid md:place-items-center md:p-6" inert={isOperatingHoursOpen}>
	<section
		class="cafeteria-page app-page-frame relative w-full bg-brand-surface pb-[var(--bottom-navigation-height)] shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:w-[min(100%,430px)] md:border md:border-brand-border"
		aria-label="학식"
	>
		<div class="cafeteria-header sticky top-0 z-20 bg-white">
			{#if !embedded}<LifestylePageHeader title="학식" closeLabel="학식 닫기" variant="figma" backIconSrc="/cafeteria/back.svg" closeIconSrc="/cafeteria/close.svg" />{/if}
			<div class="flex" aria-label="식당 선택" data-cafeteria-tabs>
				{#each data.cafeterias as cafeteria, index}
					<button
						class={`cafeteria-selector flex min-w-0 flex-1 items-end justify-center px-1 text-center text-[14px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/25 ${
							activeCafeteriaIndex === index
								? 'font-semibold text-[#8a1538]'
								: 'font-medium text-[#9b989e]'
						}`}
						type="button"
						aria-pressed={activeCafeteriaIndex === index}
						onclick={() => selectCafeteria(index)}
					>
						<span class="flex max-w-full flex-col items-center gap-2 pt-3">
							<span class="px-2 leading-[1.2]">{getCafeteriaSelectorLabel(cafeteria)}</span>
							<span class="h-0.5 w-full rounded-sm bg-current transition-colors duration-300" data-cafeteria-tab-indicator aria-hidden="true"></span>
						</span>
					</button>
				{/each}
			</div>
		</div>

		<div class="cafeteria-content px-5 py-6">
			{#if activeCafeteria}
				<div>
					<div data-cafeteria-introduction>
						<h2 class="m-0 py-0.5 text-[18px] font-bold leading-[1.2] text-[#19181a]">{getCafeteriaSelectorLabel(activeCafeteria)}</h2>
						<p class="m-0 py-0.5 text-[12px] leading-[1.2] text-[#6c6a70]">{getCafeteriaDescription(activeCafeteria)}</p>
					</div>
					<div class="cafeteria-utility-row mt-4 flex flex-wrap items-center gap-x-6" data-cafeteria-utility-row>
						<div class="flex flex-wrap items-center gap-x-6" role="group" aria-label="학식 동작" data-cafeteria-actions>
							<button class="cafeteria-action flex min-h-11 items-center gap-2 whitespace-nowrap px-1 text-[12px] font-normal leading-[1.2] text-[#8a1538]" type="button" onclick={viewOnMap} data-cafeteria-map-action>
								<span class="cafeteria-utility-icon cafeteria-map-icon" aria-hidden="true"></span>
								지도에서 보기
							</button>
							<button class="cafeteria-action flex min-h-11 items-center gap-2 whitespace-nowrap px-1 text-[12px] font-normal leading-[1.2] text-[#6c6a70]" type="button" onclick={openOperatingHours} bind:this={operatingHoursButton} aria-haspopup="dialog" aria-expanded={isOperatingHoursOpen} aria-controls="cafeteria-operating-hours">
								<span class="cafeteria-utility-icon cafeteria-info-icon text-[#9b989e]" aria-hidden="true"></span>
								운영시간
							</button>
						</div>
					</div>
					{#if activeCafeteria.source === 'crawler' && activeWeeklyMenu}
						<div class="cafeteria-day-tabs mt-4 grid grid-cols-5 gap-2" data-cafeteria-day-tabs>
							{#each activeWeeklyMenu.days as day}
								<button class="cafeteria-day-option" class:selected={activeDayKey === day.key} type="button" aria-pressed={activeDayKey === day.key} aria-label={`${formatShortDate(day.date)} (${day.day}) 식단`} data-cafeteria-day-key={day.key} onclick={() => selectDay(day.key)}>
									<span data-cafeteria-day-label>{day.day}</span>
								</button>
							{/each}
						</div>
					{/if}

						{#if activeCafeteria.source === 'crawler' && selectedMenuDay}
							<p class="sr-only" data-cafeteria-date>
								{formatShortDate(selectedMenuDay.date)} ({selectedMenuDay.day})
							</p>
						{/if}

					{#if activeCafeteria.source === 'crawler' && activeWeeklyMenu}
						{#if feedbackLoading}
							<p class="py-2 text-[13px] text-brand-muted" role="status">평가를 불러오는 중이에요.</p>
						{:else if feedbackError}
							<p class="py-2 text-[13px] text-brand-muted" role="status">{feedbackError} <button class="underline" type="button" onclick={() => loadFeedback()}>다시 시도</button></p>
						{/if}
						{#if hasMenuItems}
						<div class="cafeteria-meal-list mt-4" data-cafeteria-meal-list>
							{#each activeMeals as meal}
								{@const isExpanded = expandedMealId === meal.id}
								<div class="cafeteria-meal-item" class:expanded={isExpanded}>
									<button
										class="cafeteria-meal-heading"
										type="button"
										aria-expanded={isExpanded}
										aria-controls={`cafeteria-meal-${meal.id}`}
										aria-label={`${meal.name} 메뉴 ${isExpanded ? '접기' : '펼치기'}`}
										onclick={() => toggleMeal(meal.id)}
									>
										<span class="cafeteria-list-pin" data-cafeteria-list-pin aria-hidden="true"></span>
										<h3 data-cafeteria-meal-title>{meal.name}</h3>
										<span class="cafeteria-utility-icon cafeteria-meal-chevron" class:expanded={isExpanded} aria-hidden="true"></span>
									</button>
									{#if isExpanded}
										<div id={`cafeteria-meal-${meal.id}`} role="region" aria-label={`${meal.name} 메뉴`}>
											{#if meal.items.length > 0}
												<div>
													{#each meal.items as item}
														{@const feedbackKey = getMenuFeedbackKey(meal, item)}
														{@const feedback = cafeteriaFeedback[feedbackKey]}
														{@const availability = getWeeklyVoteAvailability(selectedMenuDay?.date ?? '')}
														<CafeteriaMenuVoteRow
															menuName={item}
															{feedback}
															isLoading={feedbackLoading}
															isAuthenticated={Boolean(data.user)}
															isVoteOpen={availability.isOpen}
															availableFromDayLabel={availability.availableFromDayLabel}
															isSubmitting={Boolean(feedback && submittingOfferingIds.includes(feedback.offeringId))}
															onVote={(reaction) => voteForMenu(feedbackKey, feedback, reaction)}
															onLoginRequired={() => (isLoginPromptOpen = true)}
															onFutureVote={(dayLabel) => showToast(dayLabel ? `${dayLabel}부터 평가할 수 있어요` : '평가 기간이 지났습니다.')}
														/>
													{/each}
												</div>
											{:else}<p class="cafeteria-meal-empty">등록된 메뉴가 없습니다.</p>{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
						{:else}
							<p class="cafeteria-empty" data-cafeteria-empty>{selectedMenuDay?.date === activeWeeklyMenu.todayDate ? '오늘은 학식 운영 정보가 없어요' : '선택한 날에는 학식 운영 정보가 없어요'}</p>
						{/if}
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

			{#if activeCafeteria?.source === 'static'}
			<a
				class="mt-6 flex min-h-14 items-center justify-between border-y border-brand-border py-3 text-[13px] font-bold text-brand-muted transition-colors hover:text-brand"
				href="/?panel=facility&category=restaurant"
			>
				<span>다른 교내 식당 찾기</span>
				<ChevronRight size={16} strokeWidth={2.4} />
			</a>
			{/if}
		</div>
	</section>
</main>

{#if toastMessage}
	<div
		class="fixed inset-x-5 z-[70] mx-auto max-w-[390px] rounded-[14px] bg-brand-text px-4 py-3 text-center text-sm font-bold text-white shadow-[0_12px_28px_rgba(25,24,26,0.24)]"
		style="bottom: calc(var(--bottom-navigation-height) + 16px);"
		role="status"
		aria-live="polite"
	>
		{toastMessage}
	</div>
{/if}

{#if isLoginPromptOpen}
	<div class="fixed inset-0 z-[80] grid place-items-end md:place-items-center md:p-5">
		<button
			class="absolute inset-0 bg-black/40"
			type="button"
			aria-label="로그인 안내 닫기"
			onclick={() => (isLoginPromptOpen = false)}
		></button>
		<div
			class="relative w-full rounded-t-[24px] bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-6 shadow-[0_-18px_42px_rgba(42,10,20,0.22)] md:max-w-[430px] md:rounded-[24px]"
			role="dialog"
			aria-modal="true"
			aria-label="메뉴 평가 로그인 안내"
		>
			<h2 class="m-0 text-[18px] font-black tracking-[-0.02em]">로그인하고 메뉴를 평가해 주세요</h2>
			<p class="m-0 mt-2 text-[13px] font-bold leading-5 text-brand-muted">평가는 계정당 한 번만 반영돼요.</p>
			<div class="mt-5 grid gap-2">
				<a class="flex min-h-12 items-center justify-center rounded-[14px] bg-brand text-sm font-black text-white" href={loginHref}>카카오로 로그인</a>
				<button class="min-h-11 text-sm font-bold text-brand-muted" type="button" onclick={() => (isLoginPromptOpen = false)}>나중에</button>
			</div>
		</div>
	</div>
{/if}

{#if isOperatingHoursOpen && activeCafeteria}
	<div class="operating-hours-overlay fixed inset-x-0 top-0 z-50 grid place-items-end" data-operating-hours-overlay>
		<button class="absolute inset-0 bg-[rgba(25,24,26,0.54)]" type="button" aria-label="운영시간 배경 닫기" tabindex="-1" onclick={closeOperatingHours}></button>
		<div class="operating-hours-sheet relative flex max-h-full w-full flex-col overflow-hidden rounded-t-[20px] bg-white text-[#19181a] outline-none" id="cafeteria-operating-hours" bind:this={operatingHoursDialog} role="dialog" aria-modal="true" aria-labelledby="operating-hours-title" aria-describedby="operating-hours-cafeteria" tabindex="-1" onkeydown={handleOperatingHoursKeydown}>
			<button class="relative flex h-5 w-full shrink-0 items-start justify-center pt-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25" type="button" aria-label="운영시간 닫기" onclick={closeOperatingHours} data-operating-hours-handle>
				<span class="h-1 w-9 rounded-sm bg-[#f0efec]" aria-hidden="true"></span>
			</button>
			<div class="min-h-0 overflow-y-auto overscroll-contain px-5 pb-[45px] pt-4">
				<h2 class="m-0 py-0.5 text-[18px] font-bold leading-[1.2]" id="operating-hours-title">운영 시간</h2>
				<p class="sr-only" id="operating-hours-cafeteria">{getCafeteriaSelectorLabel(activeCafeteria)}</p>
				{#if form?.operatingHoursError || operatingHoursError}
					<p class="m-0 border-y border-[#ecc8cf] py-3 text-[13px] font-bold text-[#a4273f]">{form?.operatingHoursError ?? operatingHoursError}</p>
				{/if}
				{#if operatingHoursLoading}
					<p class="m-0 border-y border-brand-border py-5 text-[13px] text-brand-muted">운영시간을 불러오는 중이에요.</p>
				{:else if operatingHoursError}
					<button class="flex min-h-12 w-full items-center justify-between border-b border-brand-border text-left text-[13px] font-bold text-brand" type="button" onclick={openOperatingHours}><span>다시 시도</span><ChevronRight size={15} strokeWidth={2.4} /></button>
				{:else if !isEditingOperatingHours}
					{#if activeOperatingHours.length > 0}
						<dl class="m-0 mt-4" data-operating-hours-rows>
							{#each activeOperatingHours as row}
								<div class="flex min-h-10 items-center justify-between gap-3 py-2.5">
									<dt class="min-w-0 py-0.5 text-[14px] font-semibold leading-[1.2]">{row.label}
										{#if !hasOnlyWeekdayHours || row.daysOfWeek.length !== 5}<span class="mt-1 block text-[12px] font-normal text-[#6c6a70]">{formatOperatingDays(row.daysOfWeek)}</span>{/if}
									</dt>
									<dd class="m-0 shrink-0 py-0.5 text-[12px] leading-[1.2] tabular-nums">{row.opensAt} – {row.closesAt}</dd>
								</div>
							{/each}
						</dl>
						<div class="mt-4 px-1">
							<div class="flex items-center gap-2 rounded-[12px] border border-[#e7e5e7] bg-[#f8f8f6] px-6 py-[9px] text-[13px] leading-[1.4] text-[#9b989e]">
								<span class="cafeteria-utility-icon cafeteria-info-icon" aria-hidden="true"></span>
								<div>
									{#if hasOnlyWeekdayHours}<p class="m-0 font-semibold">주말 및 공휴일 미운영</p>{/if}
									<p class="m-0">식당 운영 시간은 변경될 수 있습니다</p>
								</div>
							</div>
						</div>
					{:else}
						<p class="m-0 border-y border-brand-border py-5 text-[13px] text-brand-muted">운영시간 정보가 아직 없어요.</p>
					{/if}
					{#if data.canEditOperatingHours}
						<button class="mt-3 flex min-h-11 w-full items-center justify-end gap-1.5 text-[13px] font-bold text-brand-muted" type="button" onclick={startOperatingHoursEdit}><Pencil size={14} strokeWidth={2.4} /> 운영시간 수정</button>
					{/if}
				{:else}
					<form method="POST" action="/cafeteria?/saveOperatingHours" use:enhance={enhanceOperatingHours} onsubmit={prepareOperatingHoursSubmit}>
						<input type="hidden" name="operatingHours" bind:value={operatingHoursPayload} />
						<div class="border-t border-brand-border">
							{#each operatingHourDrafts as draft, index}
								<div class="border-b border-brand-border py-4">
									<div class="flex items-center gap-3"><input class="h-10 min-w-0 flex-1 border-b border-brand-border bg-transparent px-1 text-[15px] font-bold outline-none focus:border-brand" aria-label={`운영 항목 ${index + 1}`} bind:value={draft.label} maxlength="40" /><button class="grid h-10 w-10 shrink-0 place-items-center text-brand-muted" type="button" aria-label={`${draft.label} 삭제`} onclick={() => removeOperatingHour(index)}><Trash2 size={16} /></button></div>
									<div class="mt-3 grid grid-cols-7 gap-1">{#each weekdays as day}<button class={`h-8 border-b-2 text-[12px] font-bold ${draft.daysOfWeek.includes(day.value) ? 'border-brand text-brand' : 'border-transparent text-brand-muted'}`} type="button" aria-pressed={draft.daysOfWeek.includes(day.value)} onclick={() => toggleDraftDay(index, day.value)}>{day.label}</button>{/each}</div>
									<div class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3"><input class="h-10 min-w-0 border-b border-brand-border bg-transparent px-1 text-center text-[14px] tabular-nums outline-none focus:border-brand" type="time" aria-label={`${draft.label} 시작 시간`} bind:value={draft.opensAt} /><span class="text-brand-muted">–</span><input class="h-10 min-w-0 border-b border-brand-border bg-transparent px-1 text-center text-[14px] tabular-nums outline-none focus:border-brand" type="time" aria-label={`${draft.label} 종료 시간`} bind:value={draft.closesAt} /></div>
								</div>
							{/each}
						</div>
						{#if operatingHourDrafts.length < 8}<button class="flex min-h-12 w-full items-center justify-center gap-1.5 border-b border-brand-border text-[13px] font-bold text-brand" type="button" onclick={addOperatingHour}><Plus size={15} strokeWidth={2.4} /> 운영시간 추가</button>{/if}
						<div class="mt-4 flex items-center justify-end gap-4"><button class="min-h-11 px-2 text-[13px] font-bold text-brand-muted" type="button" onclick={() => (isEditingOperatingHours = false)}>취소</button><button class="min-h-11 rounded-[10px] bg-brand px-5 text-[13px] font-black text-white disabled:opacity-50" type="submit" disabled={isSavingOperatingHours}>{isSavingOperatingHours ? '저장 중' : '저장'}</button></div>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.cafeteria-screen.embedded { display: block; min-height: 0; height: 100%; padding: 0; background: white; --bottom-navigation-height: 0px; }
	.embedded .cafeteria-page { height: 100%; min-height: 0; width: 100%; padding-bottom: 0; border: 0; border-radius: 0; box-shadow: none; }
	.cafeteria-screen { color: #19181a; font-weight: 400; letter-spacing: 0; }
	.cafeteria-page { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
	.cafeteria-header { flex-shrink: 0; margin-bottom: 2px; }
	.cafeteria-content { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; }
	.cafeteria-content::-webkit-scrollbar { display: none; }
	/* 전역 입력 요소 리셋보다 피그마의 탭·안내 동작 글자 크기를 우선한다. */
	.cafeteria-selector { font-size: 14px; }
	.cafeteria-action { font-size: 12px; line-height: 1.2; }
	.cafeteria-utility-row { height: 24px; flex-wrap: nowrap; }
	.cafeteria-utility-row > div { height: 24px; flex-wrap: nowrap; }
	.cafeteria-day-option { position: relative; display: grid; place-items: center; min-width: 0; height: 40px; padding: 8px; border: 0; border-radius: 20px; background: #f8f8f6; color: #9b989e; font-size: 14px; font-weight: 500; line-height: 24px; }
	.cafeteria-day-option::before { content: ''; position: absolute; inset: -2px 0; }
	.cafeteria-day-option.selected { color: white; background: #8a1538; }
	.cafeteria-day-option:focus-visible, .cafeteria-meal-heading:focus-visible { outline: 2px solid #8a1538; outline-offset: 2px; }
	.cafeteria-meal-item { overflow: hidden; border-bottom: 1px solid #f0efec; background: white; transition: background-color 200ms; }
	.cafeteria-meal-item.expanded { background: #f8f8f6; }
	.cafeteria-meal-heading { display: flex; align-items: center; gap: 16px; width: 100%; min-height: 49px; padding: 14px 18px; border: 0; background: transparent; color: #19181a; text-align: left; }
	.cafeteria-list-pin { width: 3px; height: 21px; flex-shrink: 0; border-radius: 2px; background: #8a1538; }
	.expanded .cafeteria-list-pin { background: #f0efec; }
	.cafeteria-meal-heading h3 { flex: 1; min-width: 0; margin: 0; padding: 2px 0 2px 8px; font-size: 14px; font-weight: 600; line-height: 1.2; }
	.cafeteria-meal-chevron { color: #9b989e; --cafeteria-icon: url('/cafeteria/chevron-down.svg'); }
	.cafeteria-meal-chevron.expanded { --cafeteria-icon: url('/cafeteria/chevron-up.svg'); }
	.cafeteria-meal-empty { margin: 0; padding: 10px 16px 10px 32px; color: #6c6a70; font-size: 14px; line-height: 1.2; }
	.cafeteria-empty { margin: 0; padding: 40px 16px; color: #9b989e; font-size: 14px; line-height: 1.4; text-align: center; }
	.cafeteria-utility-icon {
		display: inline-block;
		width: 20px;
		height: 20px;
		flex-shrink: 0;
		background-color: currentColor;
		mask: var(--cafeteria-icon) center / contain no-repeat;
	}
	.cafeteria-map-icon { --cafeteria-icon: url('/cafeteria/map.svg'); }
	.cafeteria-info-icon { --cafeteria-icon: url('/cafeteria/info.svg'); }
	.operating-hours-overlay { bottom: var(--bottom-navigation-height); }
	.operating-hours-sheet { max-height: min(680px, calc(100dvh - var(--bottom-navigation-height) - 20px)); }
	@media (prefers-reduced-motion: reduce) { .cafeteria-meal-item { transition: none; } }
	@media (min-width: 768px) {
		.cafeteria-page { height: min(860px, calc(100dvh - 48px)); }
		.operating-hours-overlay { width: min(100%, 430px); margin-inline: auto; }
	}
</style>
