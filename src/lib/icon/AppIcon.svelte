<script lang="ts">
	export type AppIconName =
		| 'bell'
		| 'bus'
		| 'cafe'
		| 'chevron'
		| 'clear'
		| 'comment'
		| 'convenience_store_GS'
		| 'crimson_store'
		| 'edit'
		| 'food'
		| 'gym'
		| 'home'
		| 'my'
		| 'post_office'
		| 'print'
		| 'save'
		| 'search'
		| 'setting'
		| 'shop'
		| 'thumbsdown'
		| 'thumbsup'
		| 'today';

	let {
		name,
		size = 24,
		label,
		class: className = ''
	}: {
		name: AppIconName;
		size?: 20 | 24;
		label?: string;
		class?: string;
	} = $props();

	const assetPath = $derived(`/${size} icon/${name}.svg`);
</script>

<span
	class={`inline-block shrink-0 bg-current ${className}`}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
	style={`width:${size}px;height:${size}px;mask-image:url('${assetPath}');mask-position:center;mask-repeat:no-repeat;mask-size:contain;-webkit-mask-image:url('${assetPath}');-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;-webkit-mask-size:contain;`}
></span>
