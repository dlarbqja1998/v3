<script lang="ts">
	import { ChevronLeft, TriangleAlert } from '@lucide/svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData | null } = $props();
	let confirmation = $state('');
	const requiredText = '탈퇴하겠습니다';
</script>
<svelte:head><title>회원 탈퇴 | 골라바유</title></svelte:head>
<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6"><section class="min-h-dvh w-full bg-white md:w-[min(100%,430px)] md:rounded-[28px] md:border md:border-brand-border-strong">
	<header class="grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border px-2"><a class="grid h-11 w-11 place-items-center" href="/my" aria-label="마이페이지로 돌아가기"><ChevronLeft size={22} /></a><h1 class="m-0 text-center text-lg font-black">회원 탈퇴</h1><span></span></header>
	<div class="px-5 pb-10 pt-6"><TriangleAlert class="text-brand" size={28} /><h2 class="m-0 mt-4 text-lg font-black">탈퇴하면 복구할 수 없습니다.</h2><ul class="mt-4 space-y-2 pl-5 text-sm leading-6 text-brand-muted"><li>계정과 프로필 정보</li><li>작성한 문의와 운영팀 답변</li><li>현재 기기에서 남긴 학식 평가</li></ul><p class="m-0 mt-6 border-t border-brand-border pt-6 text-sm font-bold">계속하려면 아래에 <strong class="text-brand">{requiredText}</strong>를 입력해 주세요.</p>
	<form method="POST" action="?/withdraw" class="mt-4 grid gap-4"><input class="h-12 border-b border-brand-border-strong px-1 text-sm outline-none focus:border-brand" name="confirmation" bind:value={confirmation} autocomplete="off" placeholder={requiredText} />{#if form?.message}<p class="m-0 text-sm font-bold text-red-600">{form.message}</p>{/if}<button class="h-14 bg-brand text-sm font-black text-white disabled:bg-brand-border-strong" type="submit" disabled={confirmation !== requiredText}>회원 탈퇴</button><a class="py-3 text-center text-sm font-black text-brand-muted" href="/my">취소</a></form></div>
</section></main>
