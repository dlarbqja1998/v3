<script lang="ts">
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import KuMembershipBenefits from '$lib/restaurant/KuMembershipBenefits.svelte';
	import DetailSectionHeading from '$lib/restaurant/DetailSectionHeading.svelte';
	import { getRestaurantMapHref, membershipIsActive, type RestaurantDetail, type RestaurantSummary } from '$lib/domain/restaurants';
	import { restaurantWeekdays } from '$lib/domain/restaurant-catalog';
	import { getFacilityOfficialUrl, getFacilityPhoneLinks } from '$lib/domain/campus-facilities';

	let { restaurant, isAuthenticated, onBack, onHome, onMap, loading = false, loadError = '', onRetry }: {
		restaurant: RestaurantSummary | RestaurantDetail;
		isAuthenticated: boolean;
		onBack: () => void;
		onHome?: () => void;
		onMap?: () => void;
		loading?: boolean;
		loadError?: string;
		onRetry?: () => void;
	} = $props();
	const detail = $derived('menus' in restaurant ? restaurant : undefined);
	const phone = $derived(getFacilityPhoneLinks(restaurant.place.phone ?? '')[0]);
	const naverUrl = $derived(getFacilityOfficialUrl(detail?.naverUrl ?? ''));
	const menus = $derived(detail?.menus ?? []);
	const weekdayLabels = ['월', '화', '수', '목', '금', '토', '일'];
	const menuCategories = $derived([...new Set(menus.map(menu => menu.category || '메뉴'))]);
	const deliveryMenusOnly = $derived(menus.length > 0 && menus.every(menu => menu.channel === 'delivery'));
	let hoursOpen = $state(false);
	let menusOpen = $state(false);
	const hoursId = $derived(`restaurant-hours-${restaurant.place.id}`);
	const menusId = $derived(`restaurant-menus-${restaurant.place.id}`);
</script>

<main class="min-h-dvh bg-brand-bg text-brand-text md:py-6">
	<div class="relative mx-auto min-h-dvh w-full max-w-[430px] bg-white pb-[calc(var(--bottom-navigation-height)+env(safe-area-inset-bottom)+24px)] md:min-h-[844px]">
		<header class="sticky top-0 z-20 border-b border-brand-border bg-white pt-[env(safe-area-inset-top)]">
			<div class="relative flex h-14 items-center justify-center px-5">
				<button type="button" class="absolute left-4 flex min-h-11 items-center text-[13px] text-brand-muted" onclick={onBack} aria-label="이전 화면으로 돌아가기"><AppIcon name="chevron" size={20} />뒤로</button>
				<h1 class="m-0 text-[18px] font-bold">음식점 안내</h1>
			</div>
		</header>
		<div class="px-5">
			<section class="py-6" aria-label="매장 기본 정보">
				<p class="m-0 text-[13px] text-brand-muted">{restaurant.zoneName} · {restaurant.sourceCategory}</p>
				<div class="mt-2 flex items-start gap-3">
					<h2 class="m-0 flex-1 break-keep text-[26px] font-bold leading-9">{restaurant.place.name}</h2>
					{#if membershipIsActive(restaurant.membership)}<span class="mt-2 shrink-0 text-[12px] font-bold text-brand">KU멤버십</span>{/if}
				</div>
				<p class="m-0 mt-3 break-keep text-[13px] leading-6 text-brand-muted">{restaurant.roadAddress}</p>
				<a class="inline-flex min-h-11 items-center gap-1 text-[13px] text-brand" href={getRestaurantMapHref(restaurant)} data-sveltekit-preload-data="off"
					onclick={(event) => { if (onMap && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onMap(); } }}>
					골라바유 지도에서 보기<AppIcon name="chevron" size={20} class="rotate-180" />
				</a>
				<div class="flex min-h-11 flex-wrap items-center justify-between gap-x-4 text-[13px]">
					{#if phone}<a class="flex min-h-11 items-center text-brand" href={phone.href} aria-label={`${phone.label} 전화 연결`}>{phone.label}</a>{:else}<span class="text-brand-muted">전화번호 확인 중</span>{/if}
					{#if naverUrl}<a class="flex min-h-11 items-center gap-1 text-brand-muted" href={naverUrl} target="_blank" rel="noopener noreferrer">네이버지도<AppIcon name="chevron" size={20} class="rotate-180" /></a>{/if}
				</div>
			</section>
			{#if membershipIsActive(restaurant.membership)}<KuMembershipBenefits membership={restaurant.membership!} />{/if}
			<section class="gb1-section" aria-label="운영시간" aria-busy={loading}>
				<DetailSectionHeading title="운영시간" expanded={hoursOpen} controls={hoursId} onToggle={() => hoursOpen = !hoursOpen} />
				<p class="m-0 mt-3 text-[16px] font-bold">{restaurant.todayHours}</p>
				{#if loading}
					<p class="m-0 mt-3 text-[13px] text-brand-muted" role="status">상세 정보 불러오는 중</p>
				{:else if loadError}
					<div class="mt-3 text-[13px]" role="alert"><p class="m-0 text-brand-muted">{loadError}</p><button class="min-h-11 text-brand" type="button" onclick={onRetry}>다시 불러오기</button></div>
				{/if}
				<div id={hoursId} hidden={!hoursOpen} class="mt-3">
					{#if detail}
						<dl class="m-0 text-[13px]">
							{#each restaurantWeekdays as weekday, i}
								{@const day = detail?.openingHours?.weekly[weekday]}
								<div class="grid grid-cols-[28px_1fr] gap-3 border-t border-brand-border py-3">
									<dt class="text-brand-muted">{weekdayLabels[i]}</dt>
									<dd class="m-0 leading-6">
										{day?.status === 'closed' ? '휴무' : day?.status === 'scheduled' ? `${day.open}~${day.closesNextDay && day.close !== '24:00' ? '다음 날 ' : ''}${day.close}` : '시간 확인 중'}
										{#each day?.breakTimes ?? [] as rest}<span class="block text-[12px] text-brand-muted">쉬는 시간 {rest.start}~{rest.end}</span>{/each}
										{#if day?.lastOrders.length}<span class="block text-[12px] text-brand-muted">마지막 주문 {day.lastOrders.join(' · ')}</span>{/if}
										{#if day?.note}<span class="block break-keep text-[12px] text-brand-muted">{day.note}</span>{/if}
									</dd>
								</div>
							{/each}
						</dl>
					{#each detail?.openingHours?.closureNotices ?? [] as notice}<p class="m-0 mt-2 text-[12px] leading-5 text-brand-muted">{notice}</p>{/each}
					{/if}
				</div>
			</section>
			<section class="gb1-section" aria-label="메뉴와 가격" aria-busy={loading}>
				<DetailSectionHeading title="메뉴" expanded={menusOpen} controls={menusId} onToggle={() => menusOpen = !menusOpen}
					meta={detail ? `${deliveryMenusOnly ? '배달 기준 · ' : ''}${menus.length}개` : '확인 중'} />
				<div id={menusId} hidden={!menusOpen} data-restaurant-menu>
					{#if detail}
						{#each menuCategories as category}
							{#if menuCategories.length > 1}<h3 class="m-0 mt-5 pb-1 text-[13px] font-bold text-brand-muted">{category}</h3>{/if}
							{#each menus.filter(menu => (menu.category || '메뉴') === category) as menu}
								<div class="flex min-h-14 items-center justify-between gap-4 border-b border-brand-border/60 py-4 last:border-0">
									<p class="m-0 min-w-0 break-keep text-[13px] font-medium">{menu.name}</p>
									<span class="shrink-0 text-[13px] tabular-nums">{menu.priceStatus === 'priced' && menu.price !== null ? `${menu.price.toLocaleString('ko-KR')}원` : menu.priceStatus === 'conflict' ? '가격 확인 중' : menu.priceText || '가격 확인 중'}</span>
								</div>
							{/each}
						{:else}<p class="m-0 py-5 text-[13px] text-brand-muted">등록된 메뉴가 없어요. 매장에 문의해 주세요.</p>{/each}
						{#if menus.length}<p class="m-0 mt-3 text-[12px] leading-5 text-brand-muted">메뉴·가격은 매장 사정에 따라 달라질 수 있어요.</p>{/if}
					{:else}<p class="m-0 py-5 text-[13px] text-brand-muted">{loadError ? '메뉴 정보를 불러오지 못했어요.' : '메뉴 불러오는 중'}</p>{/if}
				</div>
			</section>
			{#if detail?.checkedOn}<p class="m-0 pt-3 text-[12px] leading-5 text-brand-muted">{detail.checkedOn.replaceAll('-', '.')} 매장 기본정보 확인 · 네이버 플레이스</p>{/if}
		</div>
		<BottomNavigation activeKey="home" {isAuthenticated} onNavigate={onHome ? () => onHome?.() : undefined} containerClass="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px]" />
	</div>
</main>
