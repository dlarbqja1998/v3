<script lang="ts">
	import AppIcon from '$lib/icon/AppIcon.svelte';
</script>

<svelte:head>
	<title>상점 | 골라바유</title>
</svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section
		class="flex min-h-dvh w-full flex-col bg-brand-surface px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] shadow-[0_24px_60px_rgba(72,12,31,0.14)] md:min-h-[min(860px,calc(100vh-48px))] md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong"
		aria-label="상점"
	>
		<header class="flex items-center gap-3">
			<div class="grid h-12 w-12 place-items-center rounded-[16px] bg-brand text-white">
				<AppIcon name="shop" size={24} />
			</div>
			<div>
				<p class="m-0 text-sm font-black text-brand-muted">학교 밖 생활</p>
				<h1 class="m-0 mt-0.5 text-3xl font-black">상점</h1>
			</div>
		</header>

		<section class="my-auto rounded-[24px] border border-brand-border bg-white px-5 py-12 text-center">
			<div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
				<AppIcon name="shop" size={24} />
			</div>
			<h2 class="m-0 mt-5 text-xl font-black">아직 등록된 상점이 없습니다.</h2>
			<p class="m-0 mt-2 text-sm font-bold leading-6 text-brand-muted">
				학교 밖 상점 정보를 준비하고 있어요.
			</p>
		</section>

		<a
			class="flex h-14 items-center justify-center rounded-[16px] bg-brand text-base font-black text-white"
			href="/"
		>
			메인으로 돌아가기
		</a>
	</section>
</main>
