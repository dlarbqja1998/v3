<script lang="ts">
	import { ChevronRight, LogOut } from '@lucide/svelte';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
	const isAdmin = $derived(data.user.role === 'admin');
</script>

<svelte:head><title>마이 | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section class="relative min-h-dvh w-full overflow-hidden bg-white md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong" aria-label="마이페이지">
		<header class="sticky top-0 z-10 grid h-14 place-items-center border-b border-brand-border bg-white"><h1 class="m-0 text-lg font-black">마이</h1></header>
		<div class="h-[calc(100dvh-56px)] overflow-y-auto px-5 pb-[calc(96px+env(safe-area-inset-bottom))] md:h-[calc(min(860px,100vh-48px)-56px)]">
			<section class="pt-5" aria-labelledby="profile-title"><h2 id="profile-title" data-section-heading class="m-0 border-b border-brand-border pb-3 text-[15px] font-black tracking-[-0.01em]">프로필</h2>
				<a class="flex min-h-[72px] items-center gap-3 py-3 pl-3 pr-1" href="/my/edit">
					{#if data.user.profileImg}<img class="h-12 w-12 shrink-0 rounded-full object-cover" src={data.user.profileImg} alt="" referrerpolicy="no-referrer" />{:else}<span class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-map text-base font-black text-brand">{(data.user.nickname ?? '골').slice(0, 1)}</span>{/if}
					<span class="min-w-0 flex-1"><strong class="block truncate text-base">{data.user.nickname ?? '골라바유 사용자'}</strong><span class="mt-1 block truncate text-[13px] text-brand-muted">{data.user.department ?? data.user.college ?? '소속 미입력'}{data.user.grade ? ` · ${data.user.grade}` : ''}</span></span><ChevronRight class="shrink-0 text-brand-muted" size={18} />
				</a>
			</section>

			<section class="mt-9" aria-labelledby="service-title"><h2 id="service-title" data-section-heading class="m-0 border-b border-brand-border pb-3 text-[15px] font-black tracking-[-0.01em]">서비스</h2>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/notices"><span>공지사항</span><ChevronRight size={18} /></a>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/my/inquiries"><span class="flex items-center gap-2">문의하기{#if data.unreadInquiryCount > 0}<span class="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-black text-white">{data.unreadInquiryCount}</span>{/if}</span><ChevronRight size={18} /></a>
			</section>

			<section class="mt-9" aria-labelledby="info-title"><h2 id="info-title" data-section-heading class="m-0 border-b border-brand-border pb-3 text-[15px] font-black tracking-[-0.01em]">서비스 정보</h2>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/terms"><span>이용약관</span><ChevronRight size={18} /></a>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/privacy"><span>개인정보 처리방침</span><ChevronRight size={18} /></a>
				<div class="menu-row pl-3 pr-1" data-menu-row><span>앱 버전</span><span class="text-[13px] font-bold text-brand-muted">v{data.appVersion}</span></div>
			</section>

			<section class="mt-9" aria-labelledby="account-title"><h2 id="account-title" data-section-heading class="m-0 border-b border-brand-border pb-3 text-[15px] font-black tracking-[-0.01em]">계정 관리</h2>
				<form method="POST" action="?/logout"><button class="menu-row w-full bg-transparent pl-3 pr-1 text-left" data-menu-row type="submit"><span class="flex items-center gap-2"><LogOut size={16} />로그아웃</span><ChevronRight size={18} /></button></form>
				<a class="menu-row pl-3 pr-1 text-red-600" data-menu-row href="/my/withdraw"><span>회원 탈퇴</span><ChevronRight size={18} /></a>
			</section>

			{#if isAdmin}<section class="mt-9" aria-labelledby="admin-title"><h2 id="admin-title" data-section-heading class="m-0 border-b border-brand-border pb-3 text-[15px] font-black tracking-[-0.01em]">관리자 도구</h2>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/admin/events"><span>행사 관리</span><ChevronRight size={18} /></a>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/admin/pin-editor"><span>핀 수정하기</span><ChevronRight size={18} /></a>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/admin/onboarding-preview"><span>온보딩 미리보기</span><ChevronRight size={18} /></a>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/admin/notices"><span>공지 관리</span><ChevronRight size={18} /></a>
				<a class="menu-row pl-3 pr-1" data-menu-row href="/admin/inquiries"><span>문의 관리</span><ChevronRight size={18} /></a>
			</section>{/if}
		</div>
		<BottomNavigation activeKey="my" containerClass="absolute inset-x-0 bottom-0 z-30" isAuthenticated={true} />
	</section>
</main>

<style>
	.menu-row { display:flex; min-height:52px; align-items:center; justify-content:space-between; gap:12px; font-size:14px; font-weight:700; }
	.menu-row :global(svg) { color:var(--color-brand-muted); flex-shrink:0; }
</style>
