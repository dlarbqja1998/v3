<script lang="ts">
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
</script>

<svelte:head>
	<title>골라바유 v3</title>
	<meta
		name="description"
		content="고려대 세종 학생을 위한 네이버 지도 기반 로컬 생활 플랫폼"
	/>
</svelte:head>

<main class="app-shell">
	<section class="map-home" aria-label="골라바유 v3 지도 홈">
		<header class="top-bar">
			<div>
				<p class="eyebrow">Golabau v3 beta</p>
				<h1>오늘 학교 근처에서 바로 쓸 정보</h1>
			</div>
			<a class="login-button" href="/login">카카오 로그인</a>
		</header>

		<div class="search-row">
			<label>
				<span>구역</span>
				<select bind:value={selectedZone}>
					<option value="all">전체</option>
					{#each data.zones as zone}
						<option value={zone.id}>{zone.name}</option>
					{/each}
				</select>
			</label>

			<label class="search-box">
				<span>검색</span>
				<input placeholder="식당, 학식, 셔틀 정류장" />
			</label>
		</div>

		<nav class="category-tabs" aria-label="장소 카테고리">
			<button
				class:active={selectedCategory === 'all'}
				type="button"
				onclick={() => (selectedCategory = 'all')}
			>
				전체
			</button>
			{#each data.categories as category}
				<button
					class:active={selectedCategory === category.slug}
					type="button"
					onclick={() => (selectedCategory = category.slug)}
				>
					{category.name}
				</button>
			{/each}
		</nav>

		<div class="map-canvas" role="img" aria-label="고려대 세종 주변 장소 지도 미리보기">
			<div class="campus-label">고려대 세종</div>
			<div class="road road-main"></div>
			<div class="road road-sub"></div>
			<div class="zone zone-north">조치원역</div>
			<div class="zone zone-center">정문</div>
			<div class="zone zone-south">학생회관</div>

			{#each filteredPlaces as place}
				<button
					class="marker"
					class:active={activePlace?.id === place.id}
					style={markerStyle(place.latitude, place.longitude)}
					type="button"
					aria-label={`${place.name} 열기`}
					onclick={() => (activePlaceId = place.id)}
				>
					<span>{place.icon}</span>
				</button>
			{/each}
		</div>

		<section class="bottom-sheet" aria-label="오늘의 생활 정보">
			<div class="sheet-handle"></div>
			<div class="quick-grid">
				<a href="/cafeteria">
					<strong>오늘 학식</strong>
					<span>{data.todayCafeteria.summary}</span>
				</a>
				<a href="/shuttle">
					<strong>다음 셔틀</strong>
					<span>{data.nextShuttle.departureTime} {data.nextShuttle.stopName}</span>
				</a>
				<a href="/meetups">
					<strong>모임</strong>
					<span>점심 번개 열기</span>
				</a>
			</div>

			{#if activePlace}
				<article class="place-preview">
					<div>
						<p>{activePlace.categoryName}</p>
						<h2>{activePlace.name}</h2>
						<span>{activePlace.description}</span>
					</div>
					<a href={`/places/${activePlace.id}`}>자세히</a>
				</article>
			{:else}
				<p class="empty-state">선택한 조건에 맞는 장소가 아직 없습니다.</p>
			{/if}
		</section>
	</section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f7eef1;
		color: #241116;
		font-family:
			Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	.app-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 24px;
	}

	.map-home {
		width: min(100%, 430px);
		min-height: min(860px, calc(100vh - 48px));
		position: relative;
		overflow: hidden;
		border: 1px solid #ccd8cf;
		border-radius: 28px;
		background: #fff8fa;
		box-shadow: 0 24px 60px rgba(103, 16, 43, 0.18);
	}

	.top-bar {
		position: relative;
		z-index: 3;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 22px 20px 12px;
	}

	.eyebrow {
		margin: 0 0 6px;
		color: #8a1538;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		max-width: 250px;
		margin: 0;
		font-size: 24px;
		line-height: 1.18;
	}

	.login-button {
		flex: 0 0 auto;
		border-radius: 999px;
		background: #fee500;
		padding: 10px 12px;
		font-size: 13px;
		font-weight: 800;
	}

	.search-row {
		position: relative;
		z-index: 3;
		display: grid;
		grid-template-columns: 116px 1fr;
		gap: 10px;
		padding: 0 20px 12px;
	}

	label {
		display: grid;
		gap: 5px;
		color: #7b5a63;
		font-size: 11px;
		font-weight: 700;
	}

	select,
	input {
		width: 100%;
		box-sizing: border-box;
		border: 1px solid #d8e2db;
		border-radius: 12px;
		background: white;
		padding: 11px 12px;
		color: #241116;
		font: inherit;
	}

	.category-tabs {
		position: relative;
		z-index: 3;
		display: flex;
		gap: 8px;
		overflow-x: auto;
		padding: 0 20px 14px;
		scrollbar-width: none;
	}

	.category-tabs button {
		border: 1px solid #d5ded7;
		border-radius: 999px;
		background: white;
		padding: 8px 12px;
		white-space: nowrap;
		color: #6f4c56;
		font-weight: 800;
	}

	.category-tabs button.active {
		border-color: #8a1538;
		background: #8a1538;
		color: white;
	}

	.map-canvas {
		position: absolute;
		inset: 0;
		background:
			linear-gradient(135deg, rgba(138, 21, 56, 0.14), transparent 36%),
			linear-gradient(45deg, transparent 0 48%, rgba(255, 255, 255, 0.85) 48% 52%, transparent 52%),
			#f4e4e8;
	}

	.road {
		position: absolute;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.92);
		box-shadow: 0 0 0 1px rgba(215, 181, 191, 0.72);
	}

	.road-main {
		left: -12%;
		top: 42%;
		width: 128%;
		height: 24px;
		transform: rotate(-18deg);
	}

	.road-sub {
		left: 42%;
		top: 8%;
		width: 22px;
		height: 78%;
		transform: rotate(24deg);
	}

	.campus-label,
	.zone {
		position: absolute;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.78);
		padding: 6px 10px;
		color: #6c3546;
		font-size: 12px;
		font-weight: 800;
	}

	.campus-label {
		left: 38%;
		top: 38%;
	}

	.zone-north {
		left: 12%;
		top: 26%;
	}

	.zone-center {
		left: 62%;
		top: 34%;
	}

	.zone-south {
		left: 50%;
		top: 56%;
	}

	.marker {
		position: absolute;
		z-index: 2;
		width: 42px;
		height: 42px;
		display: grid;
		place-items: center;
		border: 2px solid white;
		border-radius: 50% 50% 50% 12px;
		background: #a51c45;
		box-shadow: 0 10px 24px rgba(103, 16, 43, 0.28);
		transform: translate(-50%, -50%) rotate(-45deg);
		cursor: pointer;
	}

	.marker span {
		transform: rotate(45deg);
		font-size: 18px;
	}

	.marker.active {
		background: #5f0f2d;
		outline: 4px solid rgba(165, 28, 69, 0.22);
	}

	.bottom-sheet {
		position: absolute;
		z-index: 4;
		left: 0;
		right: 0;
		bottom: 0;
		border-radius: 26px 26px 0 0;
		background: rgba(255, 248, 250, 0.96);
		padding: 10px 18px 20px;
		box-shadow: 0 -18px 40px rgba(103, 16, 43, 0.16);
		backdrop-filter: blur(14px);
	}

	.sheet-handle {
		width: 42px;
		height: 4px;
		margin: 0 auto 14px;
		border-radius: 999px;
		background: #dcc3ca;
	}

	.quick-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin-bottom: 12px;
	}

	.quick-grid a {
		display: grid;
		gap: 4px;
		min-height: 64px;
		align-content: center;
		border: 1px solid #ead4db;
		border-radius: 14px;
		background: white;
		padding: 10px;
	}

	.quick-grid strong {
		font-size: 13px;
	}

	.quick-grid span {
		color: #7b5a63;
		font-size: 12px;
		line-height: 1.35;
	}

	.place-preview {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		border-radius: 18px;
		background: #5f0f2d;
		padding: 16px;
		color: white;
	}

	.place-preview p,
	.place-preview h2 {
		margin: 0;
	}

	.place-preview p {
		color: #f4c7d4;
		font-size: 12px;
		font-weight: 800;
	}

	.place-preview h2 {
		margin-top: 4px;
		font-size: 19px;
	}

	.place-preview span {
		display: block;
		margin-top: 6px;
		color: #f7dfe6;
		font-size: 13px;
		line-height: 1.45;
	}

	.place-preview a {
		flex: 0 0 auto;
		border-radius: 999px;
		background: white;
		padding: 10px 12px;
		color: #5f0f2d;
		font-size: 13px;
		font-weight: 900;
	}

	.empty-state {
		margin: 12px 0 0;
		color: #7b5a63;
		text-align: center;
	}

	@media (max-width: 520px) {
		.app-shell {
			padding: 0;
		}

		.map-home {
			width: 100%;
			min-height: 100vh;
			border: 0;
			border-radius: 0;
		}
	}
</style>
