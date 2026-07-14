<script lang="ts">
	import {
		Bus,
		ChevronDown,
		ChevronUp,
		LogIn,
		MapPin,
		Search,
		Utensils,
		Users
	} from '@lucide/svelte';
	import NaverMap from '$lib/map/NaverMap.svelte';
	import type { CafeteriaPanelItem, DailyMenu, MenuDayKey } from '$lib/domain/places';
	import type { PageData } from './$types';

	type MealSection = {
		id: string;
		name: string;
		items: string[];
	};

	let { data }: { data: PageData } = $props();

	let selectedZone = $state('all');
	let selectedCategory = $state('all');
	let activePlaceId = $state('');
	let sheetMode = $state<'home' | 'cafeteria'>('home');
	let activeCafeteriaIndex = $state(0);
	let activeDayKey = $state<MenuDayKey>('mon');
	let expandedMealId = $state('');
	let cafeteriaScroller = $state<HTMLDivElement>();

	const filteredPlaces = $derived(
		data.places.filter((place) => {
			const zoneMatched = selectedZone === 'all' || place.zoneId === selectedZone;
			const categoryMatched = selectedCategory === 'all' || place.categorySlug === selectedCategory;
			return zoneMatched && categoryMatched;
		})
	);

	const activeCafeteria = $derived(
		data.cafeterias[activeCafeteriaIndex] ?? data.cafeterias[0] ?? null
	);

	const activePlace = $derived(
		filteredPlaces.find((place) => place.id === activePlaceId) ??
			filteredPlaces.find((place) => place.id === activeCafeteria?.placeId) ??
			filteredPlaces[0] ??
			null
	);

	const mapPlaces = $derived(
		sheetMode === 'cafeteria' && activeCafeteria
			? data.places.filter((place) => place.id === activeCafeteria.placeId)
			: filteredPlaces
	);

	const activeWeeklyMenu = $derived(activeCafeteria?.weeklyMenu ?? null);

	const selectedMenuDay = $derived(
		activeWeeklyMenu?.days?.find((day) => day.key === activeDayKey) ??
			activeWeeklyMenu?.days?.find((day) => day.key === activeWeeklyMenu.todayKey) ??
			activeWeeklyMenu?.days?.[0] ??
			null
	);

	const cafeteriaSummary = $derived(createCafeteriaSummary(data.cafeterias));
	const activeMealSections = $derived(buildMealSections(activeCafeteria, selectedMenuDay));

	$effect(() => {
		if (sheetMode !== 'cafeteria' || !activeCafeteria) return;
		selectedCategory = 'cafeteria';
		activePlaceId = activeCafeteria.placeId;
	});

	function categoryButtonClass(isActive: boolean) {
		const base = 'rounded-full border px-3 py-2 text-sm font-extrabold whitespace-nowrap transition';
		return isActive
			? `${base} border-brand bg-brand text-white shadow-[0_10px_24px_rgba(138,21,56,0.22)]`
			: `${base} border-brand-border-strong bg-white/95 text-brand-muted shadow-[0_8px_18px_rgba(103,16,43,0.08)]`;
	}

	function openCafeteriaPanel() {
		sheetMode = 'cafeteria';
		activeCafeteriaIndex = 0;
		const firstMenu = data.cafeterias[0]?.weeklyMenu;
		activeDayKey = firstMenu?.todayKey ?? 'mon';
		expandedMealId = '';
		requestAnimationFrame(() => cafeteriaScroller?.scrollTo({ left: 0, behavior: 'smooth' }));
	}

	function closeCafeteriaPanel() {
		sheetMode = 'home';
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

	function selectDay(dayKey: MenuDayKey) {
		activeDayKey = dayKey;
		expandedMealId = '';
	}

	function toggleMeal(mealId: string) {
		expandedMealId = expandedMealId === mealId ? '' : mealId;
	}

	function formatShortDate(dateStr?: string) {
		if (!dateStr) return '';
		const parts = dateStr.split('.');
		if (parts.length !== 3) return dateStr;
		return `${Number(parts[1])}.${Number(parts[2])}`;
	}

	function createCafeteriaSummary(cafeterias: CafeteriaPanelItem[]) {
		const jinri = cafeterias.find((cafeteria) => cafeteria.id === 'jinri');
		const today = jinri?.weeklyMenu?.days.find((day) => day.key === jinri.weeklyMenu?.todayKey);
		const lunch = today?.student.korean?.[0] ?? today?.student.special?.[0] ?? today?.student.snack?.[0];

		if (lunch) return lunch;
		if (jinri?.weeklyMenu) return `${formatShortDate(jinri.weeklyMenu.todayDate)} 주간 식단`;
		return '주간 식단 확인';
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
			{ id: 'student-special', name: '일품', items: day.student.special },
			{ id: 'student-snack', name: '분식', items: day.student.snack },
			{ id: 'student-dinner', name: '석식', items: day.student.dinner }
		];
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
							<li class="text-[13px] leading-relaxed text-brand-muted">{item}</li>
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
		class="relative min-h-screen w-full overflow-hidden bg-brand-surface shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong"
		aria-label="골라바유 v3 지도 홈"
	>
		<NaverMap
			clientId={data.naverMapClientId}
			places={mapPlaces}
			activePlaceId={activePlace?.id ?? ''}
			focusMode={sheetMode === 'cafeteria' ? 'top-band' : 'default'}
			onMarkerClick={(placeId) => (activePlaceId = placeId)}
		/>

		{#if sheetMode === 'home'}
			<div class="pointer-events-none absolute inset-x-0 top-0 z-10 h-56 bg-gradient-to-b from-brand-surface/95 via-brand-surface/70 to-transparent"></div>

			<header class="pointer-events-auto relative z-20 flex items-start justify-between gap-4 px-5 pb-3 pt-6">
				<div>
					<h1 class="max-w-[250px] text-3xl font-black leading-[1.08]">골라바유</h1>
				</div>
				<a
					class="flex shrink-0 items-center gap-1.5 rounded-full bg-[#fee500] px-3 py-2.5 text-[13px] font-black text-[#251900] shadow-[0_10px_24px_rgba(103,16,43,0.16)]"
					href="/login"
				>
					<LogIn size={15} strokeWidth={3} />
					로그인
				</a>
			</header>

			<div class="pointer-events-auto relative z-20 grid grid-cols-[116px_1fr] gap-2.5 px-5 pb-3">
				<label class="grid gap-1.5 text-[11px] font-bold text-brand-muted">
					<span>구역</span>
					<select
						class="w-full rounded-xl border border-brand-border-strong bg-white px-3 py-2.5 text-brand-text shadow-[0_8px_18px_rgba(103,16,43,0.08)] outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						bind:value={selectedZone}
					>
						<option value="all">전체</option>
						{#each data.zones as zone}
							<option value={zone.id}>{zone.name}</option>
						{/each}
					</select>
				</label>

				<label class="grid gap-1.5 text-[11px] font-bold text-brand-muted">
					<span>검색</span>
					<div class="flex items-center gap-2 rounded-xl border border-brand-border-strong bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(103,16,43,0.08)] focus-within:border-brand focus-within:ring-4 focus:ring-brand/15">
						<Search size={16} class="shrink-0 text-brand-muted" />
						<input
							class="min-w-0 flex-1 bg-transparent text-brand-text outline-none placeholder:text-brand-muted/65"
							placeholder="식당, 카페, 축제 검색"
						/>
					</div>
				</label>
			</div>

			<nav
				class="pointer-events-auto relative z-20 flex gap-2 overflow-x-auto px-5 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
				aria-label="장소 카테고리"
			>
				<button
					class={categoryButtonClass(selectedCategory === 'all')}
					type="button"
					onclick={() => (selectedCategory = 'all')}
				>
					전체
				</button>
				{#each data.categories as category}
					<button
						class={categoryButtonClass(selectedCategory === category.slug)}
						type="button"
						onclick={() => (selectedCategory = category.slug)}
					>
						{category.name}
					</button>
				{/each}
			</nav>
		{/if}

		<section
			class={`pointer-events-auto absolute inset-x-0 bottom-0 z-20 rounded-t-[26px] bg-brand-surface/95 px-[18px] pb-5 pt-2.5 shadow-[0_-18px_40px_rgba(103,16,43,0.16)] backdrop-blur transition-[height] duration-300 ${
				sheetMode === 'cafeteria' ? 'h-[80dvh]' : 'h-auto'
			}`}
			aria-label="오늘의 생활 정보"
		>
			<div class="mx-auto mb-3.5 h-1 w-[42px] rounded-full bg-[#dcc3ca]"></div>

			{#if sheetMode === 'home'}
				<div class="mb-3 grid grid-cols-3 gap-2">
					<button
						class="grid min-h-16 content-center gap-1 rounded-[14px] border border-brand-border bg-white p-2.5 text-left"
						type="button"
						onclick={openCafeteriaPanel}
					>
						<span class="flex items-center gap-1.5 text-[13px] font-black">
							<Utensils size={15} strokeWidth={2.8} />
							오늘 학식
						</span>
						<span class="text-xs leading-snug text-brand-muted">{cafeteriaSummary}</span>
					</button>
					<a
						class="grid min-h-16 content-center gap-1 rounded-[14px] border border-brand-border bg-white p-2.5"
						href="/shuttle"
					>
						<span class="flex items-center gap-1.5 text-[13px] font-black">
							<Bus size={15} strokeWidth={2.8} />
							다음 셔틀
						</span>
						<span class="text-xs leading-snug text-brand-muted">
							{data.nextShuttle.departureTime} {data.nextShuttle.stopName}
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
						선택한 조건에 맞는 장소가 아직 없습니다.
					</p>
				{/if}
			{:else}
				<div class="flex h-[calc(80dvh-38px)] flex-col">
					<div class="mb-3 flex items-center justify-between gap-3">
						<div>
							<p class="m-0 text-xs font-black text-brand-muted">오늘의 학식</p>
							<h2 class="m-0 mt-0.5 text-xl font-black">{activeCafeteria?.name}</h2>
						</div>
						<button
							class="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-black text-brand-muted"
							type="button"
							onclick={closeCafeteriaPanel}
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
			{/if}
		</section>
	</section>
</main>
