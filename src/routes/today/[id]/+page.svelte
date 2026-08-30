<script lang="ts">
	import { ArrowLeft, CalendarDays, MapPin, X } from '@lucide/svelte';
	import { getCampusEventStatus } from '$lib/domain/campus-events';
	import EventImageGallery from '$lib/events/EventImageGallery.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const event = $derived(data.event);
	const status = $derived(getCampusEventStatus(event, new Date()));

	function formatDateTime(value: Date) {
		return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' }).format(value);
	}
</script>

<svelte:head><title>{event.title} | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<article class="min-h-dvh w-full bg-white md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:overflow-y-auto md:rounded-[28px] md:border md:border-brand-border-strong">
		<header class="sticky top-0 z-20 grid h-[calc(56px+env(safe-area-inset-top))] grid-cols-[44px_1fr_44px] items-end border-b border-brand-border bg-white px-3 pb-1 pt-[env(safe-area-inset-top)]">
			<a class="grid h-11 w-11 place-items-center" href="/today" aria-label="행사 목록으로"><ArrowLeft size={20} /></a>
			<h1 class="m-0 truncate self-center text-center text-lg font-black">행사 상세</h1>
			<a class="grid h-11 w-11 place-items-center" href="/" aria-label="행사 닫기"><X size={20} /></a>
		</header>

		<EventImageGallery images={event.images} title={event.title} />
		<div class="px-5 py-6 pb-[calc(32px+env(safe-area-inset-bottom))]">
			<div class="flex items-center gap-2 text-[12px] font-black"><span class="text-brand">{event.category}</span><span class="text-brand-muted">{status === 'ongoing' ? '진행 중' : '진행 예정'}</span></div>
			<h2 class="m-0 mt-2 text-xl font-black leading-8">{event.title}</h2>

			<dl class="mt-6 divide-y divide-brand-border border-y border-brand-border text-[13px]">
				<div class="grid grid-cols-[72px_1fr] gap-3 py-3"><dt class="font-bold text-brand-muted">일시</dt><dd class="m-0 leading-5"><span class="block">{formatDateTime(event.startsAt)}</span><span class="block">{formatDateTime(event.endsAt)}까지</span></dd></div>
				<div class="grid grid-cols-[72px_1fr] gap-3 py-3"><dt class="font-bold text-brand-muted">장소</dt><dd class="m-0">{event.locationName}</dd></div>
				<div class="grid grid-cols-[72px_1fr] gap-3 py-3"><dt class="font-bold text-brand-muted">주최</dt><dd class="m-0">{event.organizer}</dd></div>
			</dl>

			<section class="mt-7" aria-labelledby="event-description-title"><h3 id="event-description-title" class="m-0 text-[15px] font-black">행사 안내</h3><p class="m-0 mt-3 whitespace-pre-wrap text-sm leading-7">{event.description}</p></section>
			<a class="mt-8 flex h-12 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-black text-white" href={`/?panel=event&eventId=${event.id}`}><MapPin size={17} />지도에서 보기</a>
			<p class="m-0 mt-3 flex items-center justify-center gap-1 text-[12px] text-brand-muted"><CalendarDays size={13} />행사는 종료 시 오늘 목록에서 자동으로 숨겨집니다.</p>
		</div>
	</article>
</main>
