<script lang="ts">
	import { ChevronLeft, FilePenLine, Plus } from '@lucide/svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	let editingId = $state('');
	let title = $state('');
	let content = $state('');
	let status = $state<'DRAFT' | 'PUBLISHED'>('DRAFT');
	let isPinned = $state(false);
	let showOnHome = $state(false);

	function editNotice(notice: PageData['notices'][number]) {
		editingId = notice.id;
		title = notice.title;
		content = notice.content;
		status = notice.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
		isPinned = notice.isPinned;
		showOnHome = notice.showOnHome;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function resetForm() {
		editingId = '';
		title = '';
		content = '';
		status = 'DRAFT';
		isPinned = false;
		showOnHome = false;
	}
</script>

<svelte:head><title>공지 관리 | 골라바유</title></svelte:head>

<main class="min-h-dvh bg-brand-bg text-brand-text md:grid md:place-items-center md:p-6">
	<section class="min-h-dvh w-full bg-white md:min-h-[min(900px,calc(100vh-48px))] md:w-[min(100%,430px)] md:overflow-y-auto md:rounded-[28px] md:border md:border-brand-border-strong">
		<header class="sticky top-0 z-10 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-brand-border bg-white px-2">
			<a class="grid h-11 w-11 place-items-center" href="/my" aria-label="마이페이지로 돌아가기"><ChevronLeft size={22} /></a>
			<h1 class="m-0 text-center text-lg font-black">공지 관리</h1><span></span>
		</header>

		<div class="px-5 pb-10 pt-5">
			<form method="POST" action={editingId ? '?/update' : '?/create'} class="grid gap-4">
				<input type="hidden" name="id" value={editingId} />
				<div class="flex items-center justify-between">
					<h2 class="m-0 text-base font-black">{editingId ? '공지 수정' : '새 공지'}</h2>
					{#if editingId}<button class="text-sm font-bold text-brand-muted" type="button" onclick={resetForm}>새로 작성</button>{/if}
				</div>
				<label class="grid gap-2 text-sm font-black">제목<input class="h-12 border-b border-brand-border-strong bg-transparent px-1 text-sm outline-none focus:border-brand" name="title" bind:value={title} maxlength="100" required /></label>
				<label class="grid gap-2 text-sm font-black">내용<textarea class="min-h-40 resize-y border border-brand-border bg-white p-3 text-sm leading-6 outline-none focus:border-brand" name="content" bind:value={content} maxlength="10000" required></textarea></label>
				<label class="grid gap-2 text-sm font-black">상태<select class="h-12 border-b border-brand-border-strong bg-white px-1" name="status" bind:value={status}><option value="DRAFT">임시 저장</option><option value="PUBLISHED">게시</option></select></label>
				<label class="flex h-12 items-center justify-between border-b border-brand-border text-sm font-bold"><span>목록 상단 고정</span><input type="checkbox" name="isPinned" bind:checked={isPinned} /></label>
				<label class="flex h-12 items-center justify-between border-b border-brand-border text-sm font-bold"><span>메인에 노출</span><input type="checkbox" name="showOnHome" bind:checked={showOnHome} /></label>
				{#if form?.message}<p class={`m-0 text-sm font-bold ${form.success ? 'text-emerald-600' : 'text-red-600'}`}>{form.message}</p>{/if}
				<button class="flex h-14 items-center justify-center gap-2 bg-brand text-sm font-black text-white" type="submit">
					{#if editingId}<FilePenLine size={17} />{:else}<Plus size={17} />{/if}
					<span>{editingId ? '공지 수정' : '공지 저장'}</span>
				</button>
			</form>

			<section class="mt-8">
				<h2 class="m-0 border-b border-brand-border pb-3 text-[15px] font-black">등록된 공지</h2>
				{#each data.notices as notice}
					<button class="flex min-h-14 w-full items-center justify-between gap-3 border-b border-brand-border py-3 text-left" type="button" onclick={() => editNotice(notice)}>
						<span class="min-w-0"><span class="block truncate text-sm font-black">{notice.title}</span><span class="mt-1 block text-xs font-bold text-brand-muted">{notice.status === 'PUBLISHED' ? '게시 중' : '임시 저장'}{notice.showOnHome ? ' · 메인 노출' : ''}</span></span>
						<FilePenLine class="shrink-0 text-brand-muted" size={17} />
					</button>
				{:else}<p class="m-0 py-10 text-center text-sm font-bold text-brand-muted">등록된 공지가 없습니다.</p>{/each}
			</section>
		</div>
	</section>
</main>
