<script lang="ts">
	import { Eye, LogOut, MapPin, Pencil, UserRound } from '@lucide/svelte';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import { canManageCampusBoundaries } from '$lib/domain/my-page';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>마이 | 골라바유</title>
</svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="relative min-h-dvh w-full overflow-hidden bg-brand-surface shadow-[0_24px_60px_rgba(103,16,43,0.18)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong"
		aria-label="마이페이지"
	>
		<div class="h-full min-h-dvh overflow-y-auto px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-7 md:min-h-[min(860px,calc(100vh-48px))]">
			<header>
				<p class="m-0 text-sm font-black text-brand-muted">내 계정</p>
				<h1 class="m-0 mt-2 text-3xl font-black">마이</h1>
			</header>

			<section class="mt-6 rounded-[22px] bg-brand-dark p-5 text-white shadow-[0_18px_40px_rgba(103,16,43,0.16)]">
				<div class="flex items-center gap-4">
					<div class="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-white/14">
						<UserRound size={28} strokeWidth={2.7} />
					</div>
					<div class="min-w-0">
						<p class="m-0 truncate text-2xl font-black">{data.user.nickname ?? '골라바유 사용자'}</p>
						<p class="m-0 mt-1 text-sm font-bold text-[#f7dfe6]">
							{data.user.college ?? '단과대 미입력'} · {data.user.grade ?? '학번 미입력'}
						</p>
					</div>
				</div>
			</section>

			<section class="mt-4 rounded-[20px] border border-brand-border bg-white p-4">
				<h2 class="m-0 mb-3 text-base font-black">내 정보</h2>
				<div class="grid gap-2">
					{#each data.rows as row}
						<div class="flex items-center justify-between gap-4 rounded-[14px] bg-brand-surface px-4 py-3">
							<span class="shrink-0 text-sm font-bold text-brand-muted">{row.label}</span>
							<span class="min-w-0 truncate text-right text-sm font-black text-brand-text">{row.value}</span>
						</div>
					{/each}
				</div>
			</section>

			<section class="mt-4 grid gap-2">
				<a
					class="flex h-14 items-center justify-center gap-2 rounded-[16px] bg-brand text-base font-black text-white"
					href="/my/edit"
				>
					<Pencil size={18} strokeWidth={2.8} />
					내 정보 수정하기
				</a>
				{#if canManageCampusBoundaries(data.user.role)}
					<a
						class="flex h-14 items-center justify-center gap-2 rounded-[16px] border border-brand-border-strong bg-white text-base font-black text-brand"
						href="/admin/pin-editor"
					>
						<MapPin size={18} strokeWidth={2.8} />
						핀 수정하기
					</a>
					<a
						class="flex h-14 items-center justify-center gap-2 rounded-[16px] border border-brand-border-strong bg-white text-base font-black text-brand"
						href="/admin/onboarding-preview"
					>
						<Eye size={18} strokeWidth={2.8} />
						온보딩 미리보기
					</a>
				{/if}
				<form method="POST" action="?/logout">
					<button
						class="flex h-14 w-full items-center justify-center gap-2 rounded-[16px] border border-brand-border-strong bg-white text-base font-black text-brand"
						type="submit"
					>
						<LogOut size={18} strokeWidth={2.8} />
						로그아웃
					</button>
				</form>
			</section>
		</div>

		<BottomNavigation
			activeKey="my"
			containerClass="absolute inset-x-0 bottom-0 z-30"
			isAuthenticated={true}
		/>
	</section>
</main>
