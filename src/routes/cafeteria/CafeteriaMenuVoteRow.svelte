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

<div class="flex min-h-14 items-center justify-between gap-3 border-b border-brand-border py-2.5 last:border-b-0" data-cafeteria-feedback>
	<div class="min-w-0 flex-1">
		<p class="m-0 text-[13px] font-bold leading-5 text-brand-text">{menuName}</p>
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
			disabled={isSubmitting}
			onclick={() => handleVote('like')}
		>
			<ThumbsUp size={14} strokeWidth={2.4} />
			<span>{occurrenceLikes}</span>
		</button>
		<button
			class={`flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-[10px] px-2 text-[11px] font-black transition-colors ${feedback?.myReaction === 'dislike' ? 'bg-brand text-white' : 'bg-brand-map text-brand-muted'}`}
			type="button"
			aria-label={`${menuName} 싫어요 ${occurrenceDislikes}개`}
			aria-pressed={feedback?.myReaction === 'dislike'}
			disabled={isSubmitting}
			onclick={() => handleVote('dislike')}
		>
			<ThumbsDown size={14} strokeWidth={2.4} />
			<span>{occurrenceDislikes}</span>
		</button>
	</div>
</div>
