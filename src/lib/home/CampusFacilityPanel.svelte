<script lang="ts">
	import { tick } from 'svelte';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import CampusBuildingPicker from '$lib/home/CampusBuildingPicker.svelte';
	import {
		CAMPUS_FACILITY_PURPOSES, filterCampusFacilities, getFacilityBuildingSpots,
		getFacilityOfficialUrl, getFacilityPhoneLinks, getCampusDirectoryTitle, normalizeBuildingName,
		type CampusDirectoryView, type CampusFacility
	} from '$lib/domain/campus-facilities';
	import type { CampusSpot } from '$lib/domain/campus-spots';
	import type { Place } from '$lib/domain/places';
	import { getCafeteriaPageHref } from '$lib/domain/cafeterias';

	let { facilities, view, spots, onChange, onSelect, onBack, onClose, onMap, onExpand, collapsed = false }: {
		facilities: CampusFacility[];
		view: CampusDirectoryView;
		spots: CampusSpot[];
		onChange: (change: Partial<CampusDirectoryView>) => void;
		onSelect: (id: string) => void;
		onBack: () => void;
		onClose: () => void;
		onMap: (target: CampusSpot | Place) => void;
		onExpand: () => void;
		collapsed?: boolean;
	} = $props();

	const results = $derived(filterCampusFacilities(facilities, view));
	const facility = $derived(facilities.find((item) => item.id === view.facilityId));
	const categoryFacilities = $derived(filterCampusFacilities(facilities, { category: view.category }));
	const buildings = $derived([...new Set(categoryFacilities.flatMap((item) => item.locations.flatMap((location) =>
		location.building ? [normalizeBuildingName(location.building)] : [])))].sort((a, b) => a.localeCompare(b, 'ko'))
		.map((name) => ({ name, count: filterCampusFacilities(categoryFacilities, { building: name }).length })));
	const phoneLinks = $derived(getFacilityPhoneLinks(facility?.phone ?? ''));
	const officialUrl = $derived(getFacilityOfficialUrl(facility?.officialUrl ?? ''));
	const purposeTabs = $derived(CAMPUS_FACILITY_PURPOSES.filter((tab) => view.category !== 'student-support' || tab.id !== 'food'));
	const showPurposes = $derived(!view.category || ['all', 'student-support'].includes(view.category));
	const tabIndex = $derived(Math.max(0, purposeTabs.findIndex((tab) => tab.id === view.purpose)));
	const menuHref = $derived(facility?.place ? getCafeteriaPageHref(facility.place) : null);
	let scrollHost = $state<HTMLDivElement>();
	let listScroll = 0;
	let previousFacility = '';
	let previousFilter = '';

	$effect(() => {
		const current = view.facilityId ?? '';
		const filter = `${view.category}|${view.purpose}|${view.building}|${view.query}`;
		if (previousFacility && !current && filter === previousFilter) {
			void tick().then(() => { if (scrollHost) scrollHost.scrollTop = listScroll; });
		} else if (current !== previousFacility || filter !== previousFilter) {
			void tick().then(() => { if (scrollHost) scrollHost.scrollTop = 0; });
		}
		previousFacility = current;
		previousFilter = filter;
	});

	function selectFacility(id: string) {
		listScroll = scrollHost?.scrollTop ?? 0;
		onSelect(id);
	}
	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || event.defaultPrevented) return;
		if (facility || view.returnSpotId) onBack(); else onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex min-h-0 flex-1 flex-col" data-campus-facility-panel>
	<header class="relative flex min-h-12 shrink-0 items-center justify-center border-b border-brand-border">
		{#if facility || view.returnSpotId}
			<button type="button" class="absolute left-0 flex min-h-11 items-center gap-0.5 text-[13px] text-brand-muted" onclick={onBack} aria-label={facility ? '시설 목록으로 돌아가기' : '건물 화면으로 돌아가기'}><AppIcon name="chevron" size={20} />{facility ? '목록' : '건물'}</button>
		{/if}
		<h2 class="m-0 text-center text-[18px] font-bold">{facility ? '시설 안내' : getCampusDirectoryTitle(view)}</h2>
		<button type="button" class="absolute right-0 min-h-11 px-1 text-[13px] text-brand-muted" onclick={onClose}>닫기</button>
	</header>
	{#if !collapsed}
		{#if !facility}
			<div class="flex shrink-0 items-center justify-between gap-3 pt-3 pb-2">
				<CampusBuildingPicker value={view.building} {buildings} totalCount={categoryFacilities.length} onChange={(building) => onChange({ building })} />
				<span class="shrink-0 text-[12px] tabular-nums text-brand-muted" aria-live="polite">{results.length}개 시설</span>
			</div>
			{#if showPurposes}
			<nav class="shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="시설 이용 목적">
				<div class="relative grid border-b border-brand-border" style:grid-template-columns={`repeat(${purposeTabs.length}, minmax(0, 1fr))`} style:min-width={`${purposeTabs.length * 82}px`}>
					{#each purposeTabs as tab}
						<button type="button" aria-pressed={view.purpose === tab.id} class={`h-11 whitespace-nowrap px-2 text-[13px] transition-colors duration-200 ${view.purpose === tab.id ? 'font-bold text-brand' : 'text-brand-muted'}`} onclick={(event) => { onChange({ purpose: tab.id }); event.currentTarget.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }}>{tab.label}</button>
					{/each}
					<span aria-hidden="true" class="absolute bottom-[-1px] left-0 h-0.5 bg-brand transition-transform duration-[250ms] motion-reduce:transition-none" style:width={`${100 / purposeTabs.length}%`} style:transform={`translateX(${tabIndex * 100}%)`}></span>
				</div>
			</nav>
			{/if}
		{/if}
		<div bind:this={scrollHost} class="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-campus-facility-scroll>
			{#if facility}
				<div class="border-b border-brand-border pt-5 pb-4">
					<p class="m-0 text-[12px] text-brand-muted">{facility.place?.categoryName ?? CAMPUS_FACILITY_PURPOSES.find((tab) => tab.id === facility.purpose)?.label}</p>
					<h3 class="m-0 mt-2 break-keep text-[20px] font-bold leading-7">{facility.name}</h3>
					{#if facility.description}<p class="m-0 mt-3 whitespace-pre-line break-keep text-[13px] leading-6 text-brand-muted">{facility.description}</p>{/if}
					{#if menuHref}<a class="mt-3 flex min-h-11 items-center justify-between text-[13px] text-brand" href={menuHref}>학식 메뉴 보기<AppIcon name="chevron" size={20} class="rotate-180" /></a>{/if}
					{#if facility.actions?.length}
						<nav class="mt-3" aria-label="시설 온라인 서비스">
							{#each facility.actions as action}
								{@const href = getFacilityOfficialUrl(action.url)}
								{#if href}<a class="flex min-h-11 items-center justify-between gap-3 text-[13px] font-medium text-brand" {href} target="_blank" rel="noopener noreferrer">{action.label}<AppIcon name="chevron" size={20} class="rotate-180" /></a>{/if}
							{/each}
						</nav>
					{/if}
				</div>
				<section class="border-b border-brand-border py-4" aria-label="시설 위치">
					<h4 class="m-0 mb-2 text-[15px] font-bold">찾아가는 곳</h4>
					{#each facility.locations as location}
						{@const spot = location.building ? getFacilityBuildingSpots({ ...facility, locations: [location] }, spots)[0] : undefined}
						<div class="flex items-center justify-between gap-3 py-2">
							<p class="m-0 break-keep text-[16px] font-bold leading-6">{location.label}</p>
							{#if facility.place || spot}<button type="button" class="min-h-11 shrink-0 text-[13px] text-brand" onclick={() => onMap(facility.place ?? spot!)}>지도 보기</button>{/if}
						</div>
					{/each}
					{#if !facility.place}<p class="m-0 mt-1 text-[12px] leading-5 text-brand-muted">{getFacilityBuildingSpots(facility, spots).length ? '지도는 시설이 있는 건물의 위치를 안내해요.' : '지도 위치는 확인 중이에요.'}</p>{/if}
				</section>
				<dl class="m-0 text-[13px] leading-6">
					<div class="grid grid-cols-[72px_1fr] gap-3 border-b border-brand-border py-4"><dt class="text-brand-muted">운영시간</dt><dd class="m-0 whitespace-pre-line break-keep">{facility.hours ?? '운영시간 확인 중'}{#if !facility.hours}<span class="mt-1 block text-[12px] text-brand-muted">방문 전 공식 안내나 전화로 확인해 주세요.</span>{/if}</dd></div>
					{#if facility.audience}<div class="grid grid-cols-[72px_1fr] gap-3 border-b border-brand-border py-4"><dt class="text-brand-muted">이용 대상</dt><dd class="m-0 break-keep">{facility.audience}</dd></div>{/if}
					<div class="grid grid-cols-[72px_1fr] gap-3 border-b border-brand-border py-4"><dt class="text-brand-muted">문의</dt><dd class="m-0 whitespace-pre-line break-keep">{facility.phone || '연락처 확인 중'}{#each phoneLinks as phone}<a class="flex min-h-11 items-center text-brand" href={phone.href}>{phoneLinks.length > 1 ? `${phone.label} 전화하기` : '전화하기'}</a>{/each}</dd></div>
				</dl>
				{#each facility.details ?? [] as section}
					<section class="border-b border-brand-border py-4" aria-label={section.title}>
						<h4 class="m-0 mb-3 text-[15px] font-bold">{section.title}</h4>
						<ul class="m-0 list-disc space-y-2 pl-4 text-[13px] leading-6 marker:text-brand-muted">
							{#each section.items as item}<li class="break-keep pl-0.5">{item}</li>{/each}
						</ul>
					</section>
				{/each}
				<div class="flex items-center justify-between gap-3 pt-4 text-[12px] text-brand-muted">
					<span>{facility.checkedAt ? `${facility.checkedAt.replaceAll('-', '.')} 시설 안내 확인` : ''}</span>
					{#if officialUrl}<a class="flex min-h-11 items-center gap-1 text-[13px]" href={officialUrl} target="_blank" rel="noopener noreferrer">공식 안내<AppIcon name="chevron" size={20} class="rotate-180" /></a>{/if}
				</div>
			{:else}
				{#if view.query}<div class="flex items-center justify-between gap-3 pt-3 text-[13px]"><p class="m-0 break-all font-bold">‘{view.query}’ 검색 결과</p><button type="button" class="min-h-11 shrink-0 text-brand-muted" onclick={() => onChange({ query: '' })}>초기화</button></div>{/if}
				{#each results as item (item.id)}
					<button type="button" class="flex min-h-14 w-full items-center gap-3 border-b border-brand-border py-4 text-left" onclick={() => selectFacility(item.id)}>
						<span class="min-w-0 flex-1"><strong class="block break-keep text-[15px] font-bold leading-6">{item.name}</strong><span class="mt-1 block break-keep text-[13px] leading-5 text-brand-muted">{item.locations.filter((location) => !view.building || (location.building && normalizeBuildingName(location.building) === view.building)).map((location) => location.label).join(' · ')}</span></span>
						<AppIcon name="chevron" size={20} class="rotate-180 text-brand-muted" />
					</button>
				{:else}
					<div class="py-8 text-center"><p class="m-0 text-[15px] font-bold">해당하는 시설이 없어요</p><p class="m-0 mt-2 text-[13px] text-brand-muted">다른 검색어나 건물·목적을 선택해 주세요.</p><button type="button" class="mt-3 min-h-11 text-[13px] text-brand" onclick={() => onChange({ query: '', purpose: 'all', building: '' })}>조건 초기화</button></div>
				{/each}
				{#if results.length && showPurposes}<p class="m-0 pt-5 text-[12px] leading-5 text-brand-muted">시설명이나 증명서·장학금·프린트로 검색해 보세요.</p>{/if}
			{/if}
		</div>
	{:else}
		<button class="min-h-11 text-[13px] text-brand-muted" type="button" onclick={onExpand}>시설 안내 펼치기</button>
	{/if}
</div>
