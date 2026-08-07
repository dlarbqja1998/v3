<script lang="ts">
	import { Bus, CalendarDays, Home, User, Utensils } from '@lucide/svelte';
	import { getBottomNavigationItems, type BottomNavigationKey } from '$lib/domain/bottom-navigation';

	let {
		activeKey = 'home',
		containerClass = '',
		onNavigate
	}: {
		activeKey?: BottomNavigationKey;
		containerClass?: string;
		onNavigate?: (key: BottomNavigationKey) => void;
	} = $props();

	const items = getBottomNavigationItems();

	function handleClick(event: MouseEvent, key: BottomNavigationKey) {
		if (!onNavigate || key === 'today' || key === 'my') return;
		event.preventDefault();
		onNavigate(key);
	}
</script>

<nav
	class={`border-t border-brand-border bg-white/98 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_24px_rgba(72,12,31,0.1)] backdrop-blur ${containerClass}`}
	aria-label="하단 내비게이션"
>
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
				{#if item.icon === 'home'}
					<Home size={19} strokeWidth={2.6} />
				{:else if item.icon === 'utensils'}
					<Utensils size={19} strokeWidth={2.6} />
				{:else if item.icon === 'bus'}
					<Bus size={19} strokeWidth={2.6} />
				{:else if item.icon === 'calendar-days'}
					<CalendarDays size={19} strokeWidth={2.6} />
				{:else}
					<User size={19} strokeWidth={2.6} />
				{/if}
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
