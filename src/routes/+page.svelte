<script lang="ts">
	import { Bus, LogIn, MapPin, Search, Utensils, Users } from '@lucide/svelte';
	import NaverMap from '$lib/map/NaverMap.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedZone = $state('all');
	let selectedCategory = $state('all');
	let activePlaceId = $state('');

	const filteredPlaces = $derived(
		data.places.filter((place) => {
			const zoneMatched = selectedZone === 'all' || place.zoneId === selectedZone;
			const categoryMatched = selectedCategory === 'all' || place.categorySlug === selectedCategory;
			return zoneMatched && categoryMatched;
		})
	);

	const activePlace = $derived(
		filteredPlaces.find((place) => place.id === activePlaceId) ?? filteredPlaces[0] ?? null
	);

	function categoryButtonClass(isActive: boolean) {
		const base = 'rounded-full border px-3 py-2 text-sm font-extrabold whitespace-nowrap transition';
		return isActive
			? `${base} border-brand bg-brand text-white shadow-[0_10px_24px_rgba(138,21,56,0.22)]`
			: `${base} border-brand-border-strong bg-white/95 text-brand-muted shadow-[0_8px_18px_rgba(103,16,43,0.08)]`;
	}
</script>

<svelte:head>
	<title>골라바우 v3</title>
	<meta
		name="description"
		content="고려대 세종 학생을 위한 네이버 지도 기반 로컬 생활 플랫폼"
	/>
</svelte:head>

<main class="min-h-screen bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="relative min-h-screen w-full overflow-hidden bg-brand-surface shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong"
		aria-label="골라바우 v3 지도 홈"
	>
		<NaverMap
			clientId={data.naverMapClientId}
			places={filteredPlaces}
			activePlaceId={activePlace?.id ?? ''}
			onMarkerClick={(placeId) => (activePlaceId = placeId)}
		/>

		<div class="pointer-events-none absolute inset-x-0 top-0 z-10 h-56 bg-gradient-to-b from-brand-surface/95 via-brand-surface/70 to-transparent"></div>

		<header class="pointer-events-auto relative z-20 flex items-start justify-between gap-4 px-5 pb-3 pt-6">
			<div>
				<h1 class="max-w-[250px] text-3xl font-black leading-[1.08] tracking-[-0.01em]">
					골라바유
				</h1>
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
				<div class="flex items-center gap-2 rounded-xl border border-brand-border-strong bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(103,16,43,0.08)] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
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

		<section
			class="pointer-events-auto absolute inset-x-0 bottom-0 z-20 rounded-t-[26px] bg-brand-surface/95 px-[18px] pb-5 pt-2.5 shadow-[0_-18px_40px_rgba(103,16,43,0.16)] backdrop-blur"
			aria-label="오늘의 생활 정보"
		>
			<div class="mx-auto mb-3.5 h-1 w-[42px] rounded-full bg-[#dcc3ca]"></div>

			<div class="mb-3 grid grid-cols-3 gap-2">
				<a
					class="grid min-h-16 content-center gap-1 rounded-[14px] border border-brand-border bg-white p-2.5"
					href="/cafeteria"
				>
					<span class="flex items-center gap-1.5 text-[13px] font-black">
						<Utensils size={15} strokeWidth={2.8} />
						오늘 학식
					</span>
					<span class="text-xs leading-snug text-brand-muted">{data.todayCafeteria.summary}</span>
				</a>
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
		</section>
	</section>
</main>
