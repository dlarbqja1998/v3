<script lang="ts">
	import { ChevronDown, KeyRound, LogIn, MessageCircle } from '@lucide/svelte';
	import BottomNavigation from '$lib/navigation/BottomNavigation.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	let showAdminLogin = $state(false);
	const isMyEntry = $derived(data.next === '/my');
</script>

<svelte:head>
	<title>로그인 | 골라바유</title>
</svelte:head>

<main
	class={isMyEntry
		? 'min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6'
		: 'grid min-h-dvh place-items-center bg-brand-bg px-5 py-8 text-brand-text'}
>
	<section
		class={isMyEntry
			? 'relative min-h-dvh w-full overflow-hidden bg-white md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong'
			: 'w-full max-w-[430px]'}
		aria-label={isMyEntry ? '마이 로그인' : undefined}
	>
		{#if isMyEntry}
			<header class="sticky top-0 z-10 grid h-14 place-items-center border-b border-brand-border bg-white">
				<h1 class="m-0 text-lg font-black">마이</h1>
			</header>
		{/if}

		<div
			class={isMyEntry
				? 'grid h-[calc(100dvh-56px)] place-items-center overflow-y-auto px-5 pb-[calc(var(--bottom-navigation-height)+24px)] pt-6 md:h-[calc(min(860px,100vh-48px)-56px)]'
				: 'contents'}
		>
		<div class="w-full max-w-[430px]">
		<div class="mb-9 text-center">
			<p class="m-0 text-sm font-black text-brand-muted">고려대 세종 생활앱</p>
			<h1 class="m-0 mt-2 text-4xl font-black text-brand">골라바유</h1>
			<p class="mx-auto mt-3 max-w-[280px] text-sm font-bold leading-6 text-brand-muted">
				카카오 계정으로 빠르게 시작하고, 필요한 정보만 짧게 설정해요.
			</p>
		</div>

		{#if data.loginError}
			<p class="mb-4 rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
				{data.loginError}
			</p>
		{/if}

		<a
			class="flex h-14 w-full items-center justify-center gap-3 rounded-[16px] bg-[#fee500] px-5 text-[16px] font-black text-[#251900] shadow-[0_12px_28px_rgba(103,16,43,0.14)] active:scale-[0.99]"
			href={data.kakaoAuthUrl}
		>
			<MessageCircle size={21} strokeWidth={2.8} />
			카카오톡 3초 로그인하기
		</a>

		<p class="mt-5 text-center text-xs font-bold leading-5 text-brand-muted">
			로그인하면 <a class="underline underline-offset-2" href="/terms">서비스 이용약관</a>과
			<a class="underline underline-offset-2" href="/privacy">개인정보 처리방침</a>에 동의한 것으로 간주됩니다.
		</p>

		<div class="mt-10 text-center">
			<button
				class="inline-flex items-center gap-1 text-xs font-bold text-brand-muted/70"
				type="button"
				onclick={() => (showAdminLogin = !showAdminLogin)}
			>
				관리자로 로그인
				<ChevronDown size={13} class={showAdminLogin ? 'rotate-180 transition' : 'transition'} />
			</button>
		</div>

		{#if showAdminLogin}
			<form method="POST" action="?/adminLogin" class="mt-4 rounded-[16px] border border-brand-border bg-white p-4">
				{#if form?.adminMessage}
					<p class="mb-3 rounded-[12px] bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
						{form.adminMessage}
					</p>
				{/if}

				<label class="grid gap-1.5 text-xs font-black text-brand-muted">
					아이디
					<input
						class="h-11 rounded-[12px] border border-brand-border-strong px-3 text-sm text-brand-text outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						name="adminId"
						autocomplete="username"
					/>
				</label>
				<label class="mt-3 grid gap-1.5 text-xs font-black text-brand-muted">
					비밀번호
					<input
						class="h-11 rounded-[12px] border border-brand-border-strong px-3 text-sm text-brand-text outline-none focus:border-brand focus:ring-4 focus:ring-brand/15"
						name="adminPassword"
						type="password"
						autocomplete="current-password"
					/>
				</label>
				<button
					class="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-brand-dark text-sm font-black text-white"
					type="submit"
				>
					<KeyRound size={16} strokeWidth={2.8} />
					관리자 로그인
				</button>
			</form>
		{/if}
		</div>
		</div>

		{#if isMyEntry}
			<BottomNavigation
				activeKey="my"
				containerClass="absolute inset-x-0 bottom-0 z-30"
				isAuthenticated={false}
			/>
		{/if}
	</section>
</main>
