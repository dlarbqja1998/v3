<script lang="ts">
	import { Bus, LogIn, MapPin, Search, Utensils, Users } from '@lucide/svelte';
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

	function markerStyle(latitude: number, longitude: number) {
		const left = 50 + (longitude - 127.2872) * 4200;
		const top = 50 - (latitude - 36.6109) * 5200;
		return `left: ${Math.max(8, Math.min(92, left))}%; top: ${Math.max(10, Math.min(86, top))}%;`;
	}

	const categoryButtonBase =
		'rounded-full border px-3 py-2 text-sm font-extrabold whitespace-nowrap transition';
	const categoryButtonIdle = 'border-brand-border-strong bg-white text-brand-muted';
	const categoryButtonActive = 'border-brand bg-brand text-white shadow-[0_10px_24px_rgba(138,21,56,0.22)]';
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
		<header class="relative z-10 flex items-start justify-between gap-4 px-5 pb-3 pt-6">
			<div>
				<p class="mb-1.5 text-xs font-black uppercase tracking-[0.08em] text-brand">
					Golabau v3
				</p>
				<h1 class="max-w-[250px] text-2xl font-black leading-[1.18] tracking-[-0.01em]">
					오늘 캠퍼스 근처에서 바로 쓸 정보
				</h1>
			</div>
			<a
				class="flex shrink-0 items-center gap-1.5 rounded-full bg-[#fee500] px-3 py-2.5 text-[13px] font-black text-[#251900]"
				href="/login"
			>
				<LogIn size={15} strokeWidth={3} />
				로그인
			</a>
		</header>

		<div class="relative z-10 grid grid-cols-[116px_1fr] gap-2.5 px-5 pb-3">
			<label class="grid gap-1.5 text-[11px] font-bold text-brand-muted">
				<span>구역</span>
				<select
					class="w-full rounded-xl border border-brand-border-strong bg-white px-3 py-2.5 text-brand-text outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
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
				<div class="flex items-center gap-2 rounded-xl border border-brand-border-strong bg-white px-3 py-2.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
					<Search size={16} class="shrink-0 text-brand-muted" />
					<input
						class="min-w-0 flex-1 bg-transparent text-brand-text outline-none placeholder:text-brand-muted/65"
						placeholder="식당, 한식, 카페 검색"
					/>
				</div>
			</label>
		</div>

		<nav
			class="relative z-10 flex gap-2 overflow-x-auto px-5 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			aria-label="장소 카테고리"
		>
			<button
				class={`${categoryButtonBase} ${selectedCategory === 'all' ? categoryButtonActive : categoryButtonIdle}`}
				type="button"
				onclick={() => (selectedCategory = 'all')}
			>
				전체
			</button>
			{#each data.categories as category}
				<button
					class={`${categoryButtonBase} ${selectedCategory === category.slug ? categoryButtonActive : categoryButtonIdle}`}
					type="button"
					onclick={() => (selectedCategory = category.slug)}
				>
					{category.name}
				</button>
			{/each}
		</nav>

		<div
			class="absolute inset-0 bg-brand-map"
			style="background: linear-gradient(135deg, rgba(138, 21, 56, 0.14), transparent 36%), linear-gradient(45deg, transparent 0 48%, rgba(255, 255, 255, 0.85) 48% 52%, transparent 52%), #f4e4e8;"
			role="img"
			aria-label="고려대 세종 주변 장소 지도 미리보기"
		>
			<div
				class="absolute left-[-12%] top-[42%] h-6 w-[128%] rotate-[-18deg] rounded-full bg-white/90 shadow-[0_0_0_1px_rgba(215,181,191,0.72)]"
			></div>
			<div
				class="absolute left-[42%] top-[8%] h-[78%] w-[22px] rotate-[24deg] rounded-full bg-white/90 shadow-[0_0_0_1px_rgba(215,181,191,0.72)]"
			></div>

			<div class="absolute left-[38%] top-[38%] rounded-full bg-white/80 px-2.5 py-1.5 text-xs font-black text-[#6c3546]">
				고려대 세종
			</div>
			<div class="absolute left-[12%] top-[26%] rounded-full bg-white/80 px-2.5 py-1.5 text-xs font-black text-[#6c3546]">
				조치원역
			</div>
			<div class="absolute left-[62%] top-[34%] rounded-full bg-white/80 px-2.5 py-1.5 text-xs font-black text-[#6c3546]">
				정문
			</div>
			<div class="absolute left-[50%] top-[56%] rounded-full bg-white/80 px-2.5 py-1.5 text-xs font-black text-[#6c3546]">
				학생회관
			</div>

			{#each filteredPlaces as place}
				<button
					class={`absolute z-[2] grid h-[42px] w-[42px] translate-x-[-50%] translate-y-[-50%] rotate-[-45deg] place-items-center rounded-[50%_50%_50%_12px] border-2 border-white shadow-[0_10px_24px_rgba(103,16,43,0.28)] transition ${activePlace?.id === place.id ? 'bg-brand-dark outline-4 outline-brand-marker/25' : 'bg-brand-marker'}`}
					style={markerStyle(place.latitude, place.longitude)}
					type="button"
					aria-label={`${place.name} 열기`}
					onclick={() => (activePlaceId = place.id)}
				>
					<span class="rotate-45 text-lg">{place.icon}</span>
				</button>
			{/each}
		</div>

		<section
			class="absolute inset-x-0 bottom-0 z-20 rounded-t-[26px] bg-brand-surface/95 px-[18px] pb-5 pt-2.5 shadow-[0_-18px_40px_rgba(103,16,43,0.16)] backdrop-blur"
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
