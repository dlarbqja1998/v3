<script lang="ts">
	import { ThumbsDown, ThumbsUp } from '@lucide/svelte';
	import type { MenuReaction, OfferingFeedbackSummary } from '$lib/domain/cafeteria-feedback';

	type Feedback = OfferingFeedbackSummary & { offeringId: string; isVotable: boolean };

	let {
		menuName,
		feedback,
		isAuthenticated,
		isVoteOpen,
		availableFromDayLabel,
		isSubmitting,
		isLoading = false,
		onVote,
		onLoginRequired,
		onFutureVote
	}: {
		menuName: string;
		feedback?: Feedback;
		isAuthenticated: boolean;
		isVoteOpen: boolean;
		availableFromDayLabel: string | null;
		isSubmitting: boolean;
		isLoading?: boolean;
		onVote: (reaction: MenuReaction) => void;
		onLoginRequired: () => void;
		onFutureVote: (dayLabel: string | null) => void;
	} = $props();

	const occurrenceLikes = $derived(feedback?.occurrenceLikes ?? 0);
	const occurrenceDislikes = $derived(feedback?.occurrenceDislikes ?? 0);
	const cumulativeTotal = $derived(
		(feedback?.cumulativeLikes ?? 0) + (feedback?.cumulativeDislikes ?? 0)
	);
	const cumulativeLikeRate = $derived(
		cumulativeTotal > 0
			? Math.round(((feedback?.cumulativeLikes ?? 0) / cumulativeTotal) * 100)
			: 0
	);
	const showCumulative = $derived(Boolean(feedback?.hasPreviousOffering && cumulativeTotal >= 5));

	function handleVote(reaction: MenuReaction) {
		if (!isAuthenticated) {
			onLoginRequired();
			return;
		}
		if (!isVoteOpen) {
			onFutureVote(availableFromDayLabel);
			return;
		}
		if (!feedback?.isVotable || isSubmitting) return;
		onVote(reaction);
	}
</script>

<div class="cafeteria-menu-row flex items-center justify-between gap-2" data-cafeteria-feedback>
	<span class="shrink-0 text-[14px] font-medium leading-[1.2] text-[#6c6a70]" aria-hidden="true">-</span>
	<div class="min-w-0 flex-1 pl-3">
		<p class="m-0 py-0.5 text-[14px] font-medium leading-[1.2] text-[#19181a]">{menuName}</p>
		{#if showCumulative}
			<p class="m-0 mt-0.5 text-[11px] font-bold leading-4 text-brand-muted">
				누적 {cumulativeTotal}명 · {cumulativeLikeRate}%가 좋아했어요
			</p>
		{/if}
	</div>

	<div class="flex shrink-0 items-center gap-1" role="group" aria-label={`${menuName} 평가`}>
		<button
			class={`flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-[10px] px-2 text-[11px] font-black transition-colors ${feedback?.myReaction === 'like' ? 'bg-brand text-white' : 'bg-brand-map text-brand-muted'}`}
			type="button"
			aria-label={`${menuName} 좋아요 ${occurrenceLikes}개`}
			aria-pressed={feedback?.myReaction === 'like'}
			disabled={isSubmitting || isLoading || (isAuthenticated && isVoteOpen && !feedback?.isVotable)}
			onclick={() => handleVote('like')}
		>
			<ThumbsUp size={14} strokeWidth={2.4} />
			<span>{isLoading || !feedback ? '—' : occurrenceLikes}</span>
		</button>
		<button
			class={`flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-[10px] px-2 text-[11px] font-black transition-colors ${feedback?.myReaction === 'dislike' ? 'bg-brand text-white' : 'bg-brand-map text-brand-muted'}`}
			type="button"
			aria-label={`${menuName} 싫어요 ${occurrenceDislikes}개`}
			aria-pressed={feedback?.myReaction === 'dislike'}
			disabled={isSubmitting || isLoading || (isAuthenticated && isVoteOpen && !feedback?.isVotable)}
			onclick={() => handleVote('dislike')}
		>
			<ThumbsDown size={14} strokeWidth={2.4} />
			<span>{isLoading || !feedback ? '—' : occurrenceDislikes}</span>
		</button>
	</div>
</div>

<style>
	.cafeteria-menu-row { min-height: 52px; padding: 10px 16px 10px 32px; }
</style>
