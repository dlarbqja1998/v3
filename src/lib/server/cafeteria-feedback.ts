import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import {
	aggregateOfferingFeedback,
	createOfferingKey,
	type MenuReaction,
	type OfferingFeedbackSummary
} from '$lib/domain/cafeteria-feedback';
import type { WeeklyMenu } from '$lib/domain/places';
import { createDb } from './db';
import { cafeteriaMenuOfferings, cafeteriaMenuVotes } from './db/schema';

export type CafeteriaFeedbackByKey = Record<
	string,
	OfferingFeedbackSummary & { offeringId: string; isVotable: boolean }
>;

export async function getWeeklyCafeteriaFeedback(
	databaseUrl: string | undefined,
	weeklyMenu: WeeklyMenu | null,
	userId?: number
): Promise<CafeteriaFeedbackByKey> {
	if (!databaseUrl || !weeklyMenu || weeklyMenu.days.length === 0) return {};

	const menuDates = weeklyMenu.days.map((day) => day.date.replaceAll('.', '-'));
	const firstDate = menuDates[0];
	const lastDate = menuDates.at(-1);
	if (!firstDate || !lastDate) return {};

	const db = createDb(databaseUrl);
	const currentOfferings = await db
		.select({
			id: cafeteriaMenuOfferings.id,
			menuItemId: cafeteriaMenuOfferings.menuItemId,
			cafeteriaCode: cafeteriaMenuOfferings.cafeteriaCode,
			menuDate: cafeteriaMenuOfferings.menuDate,
			mealSlot: cafeteriaMenuOfferings.mealSlot,
			menuSection: cafeteriaMenuOfferings.menuSection,
			displayName: cafeteriaMenuOfferings.displayName,
			isVotable: cafeteriaMenuOfferings.isVotable
		})
		.from(cafeteriaMenuOfferings)
		.where(
			and(
				inArray(cafeteriaMenuOfferings.cafeteriaCode, ['jinri', 'faculty']),
				gte(cafeteriaMenuOfferings.menuDate, firstDate),
				lte(cafeteriaMenuOfferings.menuDate, lastDate)
			)
		);

	if (currentOfferings.length === 0) return {};

	const menuItemIds = [...new Set(currentOfferings.map((offering) => offering.menuItemId))];
	const historicalOfferings = await db
		.select({ id: cafeteriaMenuOfferings.id, menuItemId: cafeteriaMenuOfferings.menuItemId })
		.from(cafeteriaMenuOfferings)
		.where(inArray(cafeteriaMenuOfferings.menuItemId, menuItemIds));
	const offeringIds = historicalOfferings.map((offering) => offering.id);
	const votes = offeringIds.length
		? await db
				.select({
					offeringId: cafeteriaMenuVotes.offeringId,
					userId: cafeteriaMenuVotes.userId,
					reaction: cafeteriaMenuVotes.reaction
				})
				.from(cafeteriaMenuVotes)
				.where(inArray(cafeteriaMenuVotes.offeringId, offeringIds))
		: [];

	const currentIds = new Set(currentOfferings.map((offering) => offering.id));
	const summaries = aggregateOfferingFeedback(
		historicalOfferings.map((offering) => ({
			...offering,
			isCurrent: currentIds.has(offering.id)
		})),
		votes.filter(
			(vote): vote is { offeringId: string; userId: number; reaction: 'like' | 'dislike' } =>
				vote.reaction === 'like' || vote.reaction === 'dislike'
		),
		userId
	);

	return Object.fromEntries(
		currentOfferings.map((offering) => {
			const summary = summaries.get(offering.id) ?? {
				occurrenceLikes: 0,
				occurrenceDislikes: 0,
				cumulativeLikes: 0,
				cumulativeDislikes: 0,
				hasPreviousOffering: false,
				myReaction: null
			};
			return [
				createOfferingKey(
					offering.cafeteriaCode,
					offering.menuDate,
					offering.mealSlot as 'breakfast' | 'lunch' | 'dinner' | 'all_day',
					offering.menuSection,
					offering.displayName
				),
				{ ...summary, offeringId: offering.id, isVotable: offering.isVotable }
			];
		})
	);
}

export async function getOfferingById(databaseUrl: string | undefined, offeringId: string) {
	if (!databaseUrl) return null;
	const db = createDb(databaseUrl);
	const [offering] = await db
		.select()
		.from(cafeteriaMenuOfferings)
		.where(eq(cafeteriaMenuOfferings.id, offeringId));
	return offering ?? null;
}

export type CafeteriaVoteStore = {
	find: (offeringId: string, userId: number) => Promise<{ reaction: MenuReaction } | null>;
	insert: (offeringId: string, userId: number, reaction: MenuReaction) => Promise<void>;
	update: (offeringId: string, userId: number, reaction: MenuReaction) => Promise<void>;
	remove: (offeringId: string, userId: number) => Promise<void>;
};

function createVoteStore(databaseUrl: string): CafeteriaVoteStore {
	const db = createDb(databaseUrl);
	return {
		find: async (offeringId, userId) => {
			const [vote] = await db
				.select({ reaction: cafeteriaMenuVotes.reaction })
				.from(cafeteriaMenuVotes)
				.where(
					and(
						eq(cafeteriaMenuVotes.offeringId, offeringId),
						eq(cafeteriaMenuVotes.userId, userId)
					)
				);
			if (!vote || (vote.reaction !== 'like' && vote.reaction !== 'dislike')) return null;
			return { reaction: vote.reaction };
		},
		insert: async (offeringId, userId, reaction) => {
			await db.insert(cafeteriaMenuVotes).values({ offeringId, userId, reaction });
		},
		update: async (offeringId, userId, reaction) => {
			await db
				.update(cafeteriaMenuVotes)
				.set({ reaction, updatedAt: new Date() })
				.where(
					and(
						eq(cafeteriaMenuVotes.offeringId, offeringId),
						eq(cafeteriaMenuVotes.userId, userId)
					)
				);
		},
		remove: async (offeringId, userId) => {
			await db
				.delete(cafeteriaMenuVotes)
				.where(
					and(
						eq(cafeteriaMenuVotes.offeringId, offeringId),
						eq(cafeteriaMenuVotes.userId, userId)
					)
				);
		}
	};
}

export async function toggleCafeteriaMenuVote(
	databaseUrl: string | undefined,
	offeringId: string,
	userId: number,
	reaction: MenuReaction,
	providedStore?: CafeteriaVoteStore
) {
	if (!databaseUrl && !providedStore) throw new Error('데이터베이스 연결 정보가 없습니다.');
	const store = providedStore ?? createVoteStore(databaseUrl as string);
	const existing = await store.find(offeringId, userId);

	if (!existing) {
		await store.insert(offeringId, userId, reaction);
		return { reaction };
	}
	if (existing.reaction === reaction) {
		await store.remove(offeringId, userId);
		return { reaction: null };
	}

	await store.update(offeringId, userId, reaction);
	return { reaction };
}

export async function getOfferingFeedback(
	databaseUrl: string | undefined,
	offeringId: string,
	userId: number
): Promise<(OfferingFeedbackSummary & { offeringId: string; isVotable: boolean }) | null> {
	if (!databaseUrl) return null;
	const db = createDb(databaseUrl);
	const [currentOffering] = await db
		.select({
			id: cafeteriaMenuOfferings.id,
			menuItemId: cafeteriaMenuOfferings.menuItemId,
			isVotable: cafeteriaMenuOfferings.isVotable
		})
		.from(cafeteriaMenuOfferings)
		.where(eq(cafeteriaMenuOfferings.id, offeringId));
	if (!currentOffering) return null;

	const offerings = await db
		.select({ id: cafeteriaMenuOfferings.id, menuItemId: cafeteriaMenuOfferings.menuItemId })
		.from(cafeteriaMenuOfferings)
		.where(eq(cafeteriaMenuOfferings.menuItemId, currentOffering.menuItemId));
	const offeringIds = offerings.map((offering) => offering.id);
	const votes = offeringIds.length
		? await db
				.select({
					offeringId: cafeteriaMenuVotes.offeringId,
					userId: cafeteriaMenuVotes.userId,
					reaction: cafeteriaMenuVotes.reaction
				})
				.from(cafeteriaMenuVotes)
				.where(inArray(cafeteriaMenuVotes.offeringId, offeringIds))
		: [];
	const summary = aggregateOfferingFeedback(
		offerings.map((offering) => ({ ...offering, isCurrent: offering.id === offeringId })),
		votes.filter(
			(vote): vote is { offeringId: string; userId: number; reaction: MenuReaction } =>
				vote.reaction === 'like' || vote.reaction === 'dislike'
		),
		userId
	).get(offeringId);

	return summary ? { ...summary, offeringId, isVotable: currentOffering.isVotable } : null;
}
