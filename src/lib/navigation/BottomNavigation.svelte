<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { getBottomNavigationItems, type BottomNavigationKey } from '$lib/domain/bottom-navigation';
	import AppIcon from '$lib/icon/AppIcon.svelte';
	import LoginRequiredToast from '$lib/navigation/LoginRequiredToast.svelte';
	import { getNavigationDecision } from '$lib/navigation/login-required';

	let {
		activeKey = 'home',
		containerClass = '',
		isAuthenticated = false,
		onNavigate
	}: {
		activeKey?: BottomNavigationKey;
		containerClass?: string;
		isAuthenticated?: boolean;
		onNavigate?: (key: BottomNavigationKey) => void;
	} = $props();

	const items = getBottomNavigationItems();
	let showLoginRequired = $state(false);
	let loginTimer: ReturnType<typeof setTimeout> | null = null;

	function handleClick(event: MouseEvent, key: BottomNavigationKey) {
		const decision = getNavigationDecision(key, isAuthenticated);
		if (decision.kind === 'login-required') {
			event.preventDefault();
			if (loginTimer) return;
			showLoginRequired = true;
			loginTimer = setTimeout(() => {
				void goto(decision.href);
			}, decision.delayMs);
			return;
		}

		if (!onNavigate || key === 'today' || key === 'my') return;
		event.preventDefault();
		onNavigate(key);
	}

	onDestroy(() => {
		if (loginTimer) clearTimeout(loginTimer);
	});
</script>

<div class={containerClass} data-bottom-navigation-shell>
	<nav
		class="relative h-[var(--bottom-navigation-height)] border-t border-brand-border bg-white/98 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(72,12,31,0.1)] backdrop-blur"
		aria-label="하단 내비게이션"
		data-bottom-navigation
	>
		{#if showLoginRequired}
			<LoginRequiredToast />
		{/if}
		<div class="grid grid-cols-5 gap-0.5">
			{#each items as item}
				<a
					class={`grid min-h-[58px] place-items-center gap-0.5 rounded-[8px] px-1 py-1 text-[11px] font-black transition-colors ${
						activeKey === item.key ? 'bg-transparent text-brand' : 'text-brand-muted hover:text-brand'
					}`}
					href={item.href}
					aria-current={activeKey === item.key ? 'page' : undefined}
					onclick={(event) => handleClick(event, item.key)}
				>
					<AppIcon name={item.icon} size={24} />
					<span>{item.label}</span>
				</a>
			{/each}
		</div>
	</nav>
</div>
