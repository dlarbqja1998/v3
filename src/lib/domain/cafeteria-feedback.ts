export type CafeteriaMealSlot = 'breakfast' | 'lunch' | 'dinner' | 'all_day';
export type MenuReaction = 'like' | 'dislike';

type FeedbackOffering = {
	id: string;
	menuItemId: string;
	isCurrent: boolean;
};

type FeedbackVote = {
	offeringId: string;
	userId: number;
	reaction: MenuReaction;
};

export type OfferingFeedbackSummary = {
	occurrenceLikes: number;
	occurrenceDislikes: number;
	cumulativeLikes: number;
	cumulativeDislikes: number;
	hasPreviousOffering: boolean;
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

export function normalizeMenuName(menuName: string) {
	return menuName.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

const KOREAN_DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function getKoreaDateString(now: Date) {
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: 'Asia/Seoul',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).format(now);
}

function parseCalendarDate(date: string) {
	return new Date(`${date}T00:00:00.000Z`);
}

export function getWeeklyVoteAvailability(menuDate: string, now = new Date()) {
	const today = getKoreaDateString(now);
	const todayDate = parseCalendarDate(today);
	const monday = new Date(todayDate);
	const daysSinceMonday = (todayDate.getUTCDay() + 6) % 7;
	monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
	const sunday = new Date(monday);
	sunday.setUTCDate(sunday.getUTCDate() + 6);

	const normalizedMenuDate = menuDate.replaceAll('.', '-');
	const target = parseCalendarDate(normalizedMenuDate);
	if (Number.isNaN(target.getTime()) || target < monday || target > sunday) {
		return { isOpen: false, availableFromDayLabel: null };
	}
	if (normalizedMenuDate > today) {
		return {
			isOpen: false,
			availableFromDayLabel: KOREAN_DAY_LABELS[target.getUTCDay()] ?? null
		};
	}

	return { isOpen: true, availableFromDayLabel: null };
}

export function aggregateOfferingFeedback(
	offerings: FeedbackOffering[],
	votes: FeedbackVote[],
	userId?: number
) {
	const offeringById = new Map(offerings.map((offering) => [offering.id, offering]));
	const cumulativeByMenuItem = new Map<string, { likes: number; dislikes: number }>();
	const occurrenceByOffering = new Map<string, { likes: number; dislikes: number; myReaction: MenuReaction | null }>();
	const offeringCountByMenuItem = new Map<string, number>();

	for (const offering of offerings) {
		offeringCountByMenuItem.set(
			offering.menuItemId,
			(offeringCountByMenuItem.get(offering.menuItemId) ?? 0) + 1
		);
	}

	for (const vote of votes) {
		const offering = offeringById.get(vote.offeringId);
		if (!offering) continue;

		const cumulative = cumulativeByMenuItem.get(offering.menuItemId) ?? { likes: 0, dislikes: 0 };
		if (vote.reaction === 'like') cumulative.likes += 1;
		else cumulative.dislikes += 1;
		cumulativeByMenuItem.set(offering.menuItemId, cumulative);

		if (!offering.isCurrent) continue;
		const occurrence = occurrenceByOffering.get(offering.id) ?? { likes: 0, dislikes: 0, myReaction: null };
		if (vote.reaction === 'like') occurrence.likes += 1;
		else occurrence.dislikes += 1;
		if (userId !== undefined && vote.userId === userId) occurrence.myReaction = vote.reaction;
		occurrenceByOffering.set(offering.id, occurrence);
	}

	return new Map(
		offerings
			.filter((offering) => offering.isCurrent)
			.map((offering) => {
				const occurrence = occurrenceByOffering.get(offering.id) ?? { likes: 0, dislikes: 0, myReaction: null };
				const cumulative = cumulativeByMenuItem.get(offering.menuItemId) ?? { likes: 0, dislikes: 0 };
				return [
					offering.id,
					{
						occurrenceLikes: occurrence.likes,
						occurrenceDislikes: occurrence.dislikes,
						cumulativeLikes: cumulative.likes,
						cumulativeDislikes: cumulative.dislikes,
						hasPreviousOffering: (offeringCountByMenuItem.get(offering.menuItemId) ?? 0) > 1,
						myReaction: occurrence.myReaction
					} satisfies OfferingFeedbackSummary
				];
			})
	);
}
