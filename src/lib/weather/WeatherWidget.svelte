<script lang="ts">
	import { getWeatherIconSrc, type WeatherSnapshot } from '$lib/domain/weather';

	let {
		weather,
		loading,
		error,
		bottom
	}: {
		weather: WeatherSnapshot | null;
		loading: boolean;
		error: boolean;
		bottom: number;
	} = $props();

	let imageFailed = $state(false);
	const statusText = $derived(weather?.status ?? (loading && !error ? '확인 중' : '확인 불가'));
	const temperatureValue = $derived(weather ? String(weather.temperature) : '--');
	const accessibilityText = $derived.by(() => {
		if (!weather) return loading && !error ? '날씨 확인 중' : '날씨 확인 불가';
		const prefix = weather.stale ? '이전 관측 정보: ' : '';
		return `${prefix}${weather.status}, ${weather.temperature}도`;
	});
</script>

<div
	class="pointer-events-none absolute left-[18px] z-[15] grid w-[68px] justify-items-center rounded-[18px] border border-brand-border bg-white/95 px-[7px] pb-2.5 pt-2 text-brand-text shadow-[0_12px_28px_rgba(63,7,28,0.18)] backdrop-blur"
	style={`bottom: ${bottom}px;`}
	role="status"
	aria-live="polite"
	aria-label={accessibilityText}
	data-weather-widget
>
	<div class="grid h-[52px] w-[52px] place-items-center" aria-hidden="true">
		{#if weather && !imageFailed}
			<img
				class="h-[52px] w-[52px] object-contain"
				src={getWeatherIconSrc(weather.icon)}
				alt=""
				onerror={() => (imageFailed = true)}
			/>
		{/if}
	</div>
	<strong
		class="relative mt-1 text-[23px] font-black leading-none tracking-[-0.04em]"
		data-weather-temperature
	>
		<span data-weather-temperature-value>{temperatureValue}</span>
		<span class="absolute left-full top-0" aria-hidden="true">°</span>
	</strong>
	<span class="mt-2 h-1 w-8 rounded-full bg-[#4f8dff]"></span>
	<span class="mt-1.5 text-center text-[12px] font-black leading-none text-brand-muted">
		{statusText}
	</span>
</div>
