<script lang="ts">
	import { CalendarDays } from '@lucide/svelte';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
</script>

<svelte:head>
	<title>오늘 | 골라바유</title>
</svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="relative min-h-dvh w-full overflow-hidden bg-brand-surface shadow-[0_24px_60px_rgba(72,12,31,0.14)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong"
		aria-label="오늘 행사"
	>
		<div class="min-h-dvh overflow-y-auto px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-7 md:min-h-[min(860px,calc(100vh-48px))]">
			<header class="flex items-center gap-3">
				<div class="grid h-11 w-11 place-items-center rounded-[8px] bg-brand text-white">
					<CalendarDays size={22} strokeWidth={2.7} />
				</div>
				<div>
					<p class="m-0 text-sm font-black text-brand-muted">캠퍼스 일정</p>
					<h1 class="m-0 mt-0.5 text-3xl font-black">오늘</h1>
				</div>
			</header>

			<section class="mt-8 border-y border-brand-border py-10 text-center" aria-live="polite">
				<CalendarDays class="mx-auto text-brand" size={32} strokeWidth={2.4} />
				<h2 class="m-0 mt-4 text-lg font-black">오늘 등록된 행사가 없어요</h2>
				<p class="m-0 mt-2 text-sm font-bold leading-6 text-brand-muted">
					행사와 이벤트 정보가 등록되면 이곳에 표시됩니다.
				</p>
			</section>
		</div>

		<BottomNavigation activeKey="today" containerClass="absolute inset-x-0 bottom-0 z-30" />
	</section>
</main>
