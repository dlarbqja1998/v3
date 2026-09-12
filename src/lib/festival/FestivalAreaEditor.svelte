<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Festival } from '$lib/domain/festival';
	import { addBoundaryPoint } from '$lib/map/boundary-editor';
	import { loadNaverMapSdkWithRetry, enableSecureNaverMapTiles } from '$lib/map/naver-map-sdk';
	let { clientId, area = $bindable(), onchange = () => {} }: { clientId: string; area: Festival['area']; onchange?: () => void } = $props();
	let mode = $state<'boundary' | 'pin'>('boundary');
	let host: HTMLDivElement;
	let map: any;
	let shapes: any[] = [];
	let destroyed = false;
	let ready = $state(false);
	let message = $state('');
	let observer: ResizeObserver | undefined;
	onMount(() => { void initialize(); });
	onDestroy(() => {
		destroyed = true;
		if (typeof window === 'undefined') return;
		observer?.disconnect();
		clear();
		if (map) (window.naver as any)?.maps.Event.clearInstanceListeners(map);
		map?.destroy();
	});
	$effect(() => { if (ready) draw(area); });
	function clear() { for (const shape of shapes) { (window.naver as any)?.maps.Event.clearInstanceListeners(shape); shape.setMap(null); } shapes = []; }
	async function initialize() {
		try {
			await loadNaverMapSdkWithRetry(clientId);
			if (destroyed) return;
			const maps = (window.naver as any).maps;
			map = new maps.Map(host, { center: new maps.LatLng(area.latitude, area.longitude), zoom:18, minZoom:15, maxZoom:21, mapDataControl:false, scaleControl:false });
			enableSecureNaverMapTiles(map);
			maps.Event.addListener(map, 'click', ({ coord }: any) => {
				const point = { latitude:coord.lat(), longitude:coord.lng() };
				if (mode === 'pin') area = { ...area, ...point };
				else if (area.boundary.length < 100) area = { ...area, boundary: addBoundaryPoint(area.boundary, point) };
				onchange();
			});
			if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(() => map.setSize(new maps.Size(host.clientWidth, host.clientHeight))); observer.observe(host); }
			ready = true;
		} catch { message = '지도를 불러오지 못했어요. 새로고침하거나 아래 좌표 입력을 이용해 주세요.'; }
	}
	function draw(value: Festival['area']) {
		const maps = (window.naver as any).maps;
		clear();
		if (value.boundary.length >= 3) shapes.push(new maps.Polygon({ map, paths:value.boundary.map((p) => new maps.LatLng(p.latitude,p.longitude)), fillColor:'#a61942',fillOpacity:0.12,strokeColor:'#a61942',strokeWeight:2,clickable:false }));
		const pin = new maps.Marker({map,position:new maps.LatLng(value.latitude,value.longitude),draggable:true,title:'축제 대표 핀',zIndex:200,icon:{url:'/images/map/event-pin.svg',size:new maps.Size(46,46),scaledSize:new maps.Size(46,46),anchor:new maps.Point(23,43)}});
		maps.Event.addListener(pin,'dragend',({coord}:any) => {area={...area,latitude:coord.lat(),longitude:coord.lng()};onchange();});
		shapes.push(pin);
		value.boundary.forEach((p,index) => {
			const marker = new maps.Marker({map,position:new maps.LatLng(p.latitude,p.longitude),draggable:true,title:`경계점 ${index+1}`,icon:{content:`<span style="display:grid;place-items:center;width:26px;height:26px;border:2px solid #a61942;border-radius:50%;background:white;color:#a61942;font-size:12px;font-weight:700">${index+1}</span>`,size:new maps.Size(26,26),anchor:new maps.Point(13,13)}});
			maps.Event.addListener(marker,'dragend',({coord}:any) => {area={...area,boundary:area.boundary.map((point,i)=>i===index?{latitude:coord.lat(),longitude:coord.lng()}:point)};onchange();});
			shapes.push(marker);
		});
	}
</script>

<div class="flex items-center gap-5 border-b border-brand-border" aria-label="지도 편집 도구">
	<button type="button" class:selected={mode === 'boundary'} onclick={() => mode = 'boundary'}>구역 그리기</button>
	<button type="button" class:selected={mode === 'pin'} onclick={() => mode = 'pin'}>대표 핀 놓기</button>
</div>
<p class="my-3 text-[13px] leading-5 text-brand-muted">{mode === 'boundary' ? '지도를 눌러 경계점을 추가하고, 번호를 끌어서 다듬으세요.' : '지도에서 축제 진입 핀을 놓을 곳을 누르세요. 핀을 끌어도 이동해요.'}</p>
<div class="relative h-[340px] overflow-hidden border border-brand-border bg-brand-map"><div bind:this={host} class="h-full w-full" aria-label="축제 구역 편집 지도"></div>{#if message}<p class="absolute inset-0 grid place-items-center bg-white/90 p-5 text-[13px]">{message}</p>{/if}</div>
<div class="flex items-center justify-between py-2 text-[13px] text-brand-muted"><span>경계점 {area.boundary.length}개</span><button type="button" onclick={() => {area = {...area,boundary:[]};onchange();}}>경계 다시 그리기</button></div>
<details class="border-y border-brand-border py-3"><summary class="cursor-pointer text-[13px] text-brand-muted">좌표 직접 수정 · 경계점 삭제</summary>
	<div class="mt-3 grid grid-cols-2 gap-3"><label>대표 핀 위도<input type="number" step="any" bind:value={area.latitude} oninput={onchange} /></label><label>대표 핀 경도<input type="number" step="any" bind:value={area.longitude} oninput={onchange} /></label></div>
	{#each area.boundary as point, i}<div class="mt-3 grid grid-cols-[20px_1fr_1fr_40px] items-center gap-2"><span class="text-[12px]">{i+1}</span><input aria-label={`경계점 ${i+1} 위도`} type="number" step="any" bind:value={point.latitude} oninput={onchange} /><input aria-label={`경계점 ${i+1} 경도`} type="number" step="any" bind:value={point.longitude} oninput={onchange} /><button type="button" aria-label={`경계점 ${i+1} 삭제`} onclick={() => {area = {...area,boundary:area.boundary.filter((_,index)=>index!==i)};onchange();}}>삭제</button></div>{/each}
</details>

<style>
	button{min-height:44px;font-size:13px;color:var(--color-brand-muted)}
	.selected{color:var(--color-brand);font-weight:700;border-bottom:2px solid var(--color-brand)}
	label{font-size:12px;color:var(--color-brand-muted)}
	input{width:100%;min-width:0;height:44px;border-bottom:1px solid var(--color-brand-border);font-size:13px;color:var(--color-brand-text)}
</style>
