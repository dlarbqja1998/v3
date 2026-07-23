const EXCLUDED_MENU_PATTERNS = [
	/^(?:쌀|잡곡|흑미|현미|보리)?밥$/,
	/김치$/,
	/깍두기$/,
	/단무지$/,
	/나물$/,
	/샐러드$/,
	/음료$/,
	/후식$/,
	/소스$/
];

const VOTABLE_MENU_PATTERNS = [
	/국$/,
	/찌개$/,
	/탕$/,
	/덮밥$/,
	/비빔밥$/,
	/볶음밥$/,
	/카레$/,
	/돈까스$/,
	/제육/,
	/불고기/,
	/닭갈비/,
	/치킨/,
	/파스타/,
	/면$/,
	/볶음$/,
	/구이$/,
	/조림$/,
	/튀김$/,
	/전$/
];

export type CafeteriaMealSlot = 'breakfast' | 'lunch' | 'dinner' | 'all_day';
export type MenuReaction = 'like' | 'dislike';

type FeedbackOffering = {
	id: string;
	menuItemId: string;
	isCurrent: boolean;
};

type FeedbackVote = {
	offeringId: string;
	voterHash: string;
	reaction: MenuReaction;
};

export type OfferingFeedbackSummary = {
	todayLikes: number;
	todayDislikes: number;
	historicalLikes: number;
	historicalDislikes: number;
	myReaction: MenuReaction | null;
};

export function createOfferingKey(
	cafeteriaCode: string,
	menuDate: string,
	mealSlot: CafeteriaMealSlot,
	menuSection: string,
	menuName: string
) {
	return [cafeteriaCode, menuDate, mealSlot, menuSection, normalizeMenuName(menuName)].join('|');
}

const VOTE_OPENING_TIMES: Record<CafeteriaMealSlot, string> = {
	breakfast: '08:00',
	lunch: '11:30',
	dinner: '17:00',
	all_day: '08:00'
};

export function normalizeMenuName(menuName: string) {
	return menuName.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

export function isVotableMenu(menuName: string) {
	const normalizedName = normalizeMenuName(menuName);
	if (!normalizedName) return false;
	if (EXCLUDED_MENU_PATTERNS.some((pattern) => pattern.test(normalizedName))) return false;
	if (VOTABLE_MENU_PATTERNS.some((pattern) => pattern.test(normalizedName))) return true;
	return false;
}

export function getVoteWindow(menuDate: string, mealSlot: CafeteriaMealSlot) {
	const opensAt = new Date(`${menuDate}T${VOTE_OPENING_TIMES[mealSlot]}:00+09:00`);
	const closesAt = new Date(`${menuDate}T00:00:00+09:00`);
	closesAt.setUTCDate(closesAt.getUTCDate() + 4);

	return { opensAt, closesAt };
}

export function aggregateOfferingFeedback(
	offerings: FeedbackOffering[],
	votes: FeedbackVote[],
	voterHash?: string
) {
	const offeringById = new Map(offerings.map((offering) => [offering.id, offering]));
	const historyByMenuItem = new Map<string, { likes: number; dislikes: number }>();
	const todayByOffering = new Map<string, { likes: number; dislikes: number; myReaction: MenuReaction | null }>();

	for (const vote of votes) {
		const offering = offeringById.get(vote.offeringId);
		if (!offering) continue;

		const historical = historyByMenuItem.get(offering.menuItemId) ?? { likes: 0, dislikes: 0 };
		if (vote.reaction === 'like') historical.likes += 1;
		else historical.dislikes += 1;
		historyByMenuItem.set(offering.menuItemId, historical);

		if (!offering.isCurrent) continue;
		const today = todayByOffering.get(offering.id) ?? { likes: 0, dislikes: 0, myReaction: null };
		if (vote.reaction === 'like') today.likes += 1;
		else today.dislikes += 1;
		if (voterHash && vote.voterHash === voterHash) today.myReaction = vote.reaction;
		todayByOffering.set(offering.id, today);
	}

	return new Map(
		offerings
			.filter((offering) => offering.isCurrent)
			.map((offering) => {
				const today = todayByOffering.get(offering.id) ?? { likes: 0, dislikes: 0, myReaction: null };
				const historical = historyByMenuItem.get(offering.menuItemId) ?? { likes: 0, dislikes: 0 };
				return [
					offering.id,
					{
						todayLikes: today.likes,
						todayDislikes: today.dislikes,
						historicalLikes: historical.likes,
						historicalDislikes: historical.dislikes,
						myReaction: today.myReaction
					} satisfies OfferingFeedbackSummary
				];
			})
	);
}
