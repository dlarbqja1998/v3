<script lang="ts">
	import { Bus, MapPin, User, Utensils } from '@lucide/svelte';
	import { getBottomNavigationItems, type BottomNavigationKey } from '$lib/domain/bottom-navigation';

	let {
		activeKey = 'cafeteria',
		containerClass = '',
		onNavigate
	}: {
		activeKey?: BottomNavigationKey;
		containerClass?: string;
		onNavigate?: (key: BottomNavigationKey) => void;
	} = $props();

	const items = getBottomNavigationItems();

	function handleClick(event: MouseEvent, key: BottomNavigationKey) {
		if (!onNavigate || key === 'my') return;
		event.preventDefault();
		onNavigate(key);
	}
</script>

<nav
	class={`border-t border-brand-border bg-white/96 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_28px_rgba(103,16,43,0.12)] backdrop-blur ${containerClass}`}
	aria-label="하단 네비게이션"
>
	<div class="grid grid-cols-4 gap-1">
		{#each items as item}
			<a
				class={`grid min-h-[56px] place-items-center rounded-[14px] px-1 py-1.5 text-[11px] font-black transition ${
					activeKey === item.key ? 'bg-brand-map text-brand' : 'text-brand-muted'
				}`}
				href={item.href}
				aria-current={activeKey === item.key ? 'page' : undefined}
				onclick={(event) => handleClick(event, item.key)}
			>
				{#if item.icon === 'utensils'}
					<Utensils size={19} strokeWidth={2.6} />
				{:else if item.icon === 'bus'}
					<Bus size={19} strokeWidth={2.6} />
				{:else if item.icon === 'map-pin'}
					<MapPin size={19} strokeWidth={2.6} />
				{:else}
					<User size={19} strokeWidth={2.6} />
				{/if}
				<span>{item.label}</span>
			</a>
		{/each}
	</div>
</nav>
