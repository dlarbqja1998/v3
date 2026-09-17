<script lang="ts">
	import { onMount } from 'svelte';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import { membershipIsActive, type RestaurantSummary } from '$lib/domain/restaurants';
	import { getOutsideCuisineLabel, outsidePlaceCategoryOptions, type OutsideCuisine, type OutsidePlaceCategory } from '$lib/domain/outside-place-filters';
	let {
		restaurants, zoneName, category, cuisine, membershipOnly, query, collapsed,
		clusterSelected = false, onCollapse, onOpen, onWarm, onReset, onClearCluster,
		initialScroll = 0
	}: {
		restaurants: RestaurantSummary[]; zoneName: string; category: OutsidePlaceCategory; cuisine: OutsideCuisine;
		membershipOnly: boolean; query: string; collapsed: boolean; clusterSelected?: boolean;
		onCollapse: () => void; onOpen: (id: string, scroll: number) => void; onWarm: (id: string) => void; onReset: () => void;
		onClearCluster: () => void; initialScroll?: number;
	} = $props();
	let scroller = $state<HTMLDivElement>();
	const heading = $derived(clusterSelected ? '선택 위치 가게' : query ? `‘${query}’ 검색 결과` :
		category === 'restaurant' && cuisine !== 'all' ? `${getOutsideCuisineLabel(cuisine)}${membershipOnly ? ' · KU멤버십' : ''}` :
		membershipOnly ? 'KU멤버십 가게' : category === 'all' ? '전체 가게' : outsidePlaceCategoryOptions.find(option => option.value === category)?.label ?? '가게');
	onMount(()=>{ if(scroller) scroller.scrollTop=initialScroll; });
	$effect(() => {
		if (!scroller || collapsed) return;
		const rows = scroller.querySelectorAll<HTMLAnchorElement>('[data-restaurant-id]');
		if (typeof IntersectionObserver === 'undefined') {
			Array.from(rows).slice(0, 6).forEach(row => onWarm(row.dataset.restaurantId!));
			return;
		}
		const observer = new IntersectionObserver(entries => {
			for (const entry of entries) if (entry.isIntersecting) {
				onWarm((entry.target as HTMLAnchorElement).dataset.restaurantId!);
				observer.unobserve(entry.target);
			}
		}, { root: scroller, rootMargin: '120px 0px' });
		rows.forEach(row => observer.observe(row));
		return () => observer.disconnect();
	});
</script>

<div class="flex min-h-0 flex-1 flex-col" data-restaurant-list>
	<header class="flex min-h-[54px] shrink-0 items-center justify-between gap-3">
		<div class="flex min-w-0 items-baseline gap-2">
			<h2 class="m-0 truncate text-[15px] font-bold">{heading}</h2>
			<span class="shrink-0 text-[12px] tabular-nums text-brand-muted" aria-live="polite">{restaurants.length}곳</span>
		</div>
		{#if !collapsed}<button type="button" class="min-h-11 shrink-0 text-[13px] text-brand-muted" onclick={clusterSelected ? onClearCluster : onCollapse}>{clusterSelected ? '전체 가게' : '닫기'}</button>{/if}
	</header>
	{#if !collapsed}
		<div bind:this={scroller} class="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-restaurant-scroll>
			{#each restaurants as restaurant (restaurant.place.id)}
				<a href={`/restaurants/${restaurant.place.id}`} data-restaurant-id={restaurant.place.id} data-sveltekit-preload-data="off" class="flex min-h-14 items-center gap-2 border-t border-brand-border py-[7px] text-inherit no-underline"
					onpointerenter={() => onWarm(restaurant.place.id)} onfocus={() => onWarm(restaurant.place.id)} onpointerdown={() => onWarm(restaurant.place.id)}
					onclick={(event)=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onOpen(restaurant.place.id,scroller?.scrollTop??0);}}>
					<div class="min-w-0 flex-1">
						<div class="flex min-w-0 items-baseline gap-1.5"><strong class="truncate text-[13px] font-bold leading-5">{restaurant.place.name}</strong>
						{#if membershipIsActive(restaurant.membership)}<span class="shrink-0 text-[10px] text-brand" aria-label="KU멤버십">KU</span>{/if}</div>
						<p class="m-0 truncate text-[12px] leading-[18px] text-brand-muted">{zoneName === '교외 전체' ? `${restaurant.zoneName} · ` : ''}{restaurant.sourceCategory}{membershipIsActive(restaurant.membership) ? ` · ${restaurant.membership!.summary}` : ''}</p>
					</div><AppIcon name="chevron" size={20} class="shrink-0 rotate-180 text-brand-muted" />
				</a>
			{:else}<div class="border-t border-brand-border py-7 text-center"><p class="m-0 text-[13px] text-brand-muted">조건에 맞는 가게가 없어요</p><button type="button" class="mt-1 min-h-11 text-[13px] text-brand-muted" onclick={onReset}>필터 초기화</button></div>{/each}
		</div>
	{/if}
</div>
