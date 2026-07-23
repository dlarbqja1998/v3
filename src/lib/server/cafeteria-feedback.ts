import { and, eq, gte, inArray, lte, or } from 'drizzle-orm';
import {
	aggregateOfferingFeedback,
	createOfferingKey,
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
	voterHash?: string
): Promise<CafeteriaFeedbackByKey> {
	if (!databaseUrl || !weeklyMenu || weeklyMenu.days.length === 0) return {};

	const menuDates = weeklyMenu.days.map((day) => day.date.replaceAll('.', '-'));
	const firstDate = menuDates[0];
	const lastDate = menuDates.at(-1);
	const todayDate = weeklyMenu.todayDate.replaceAll('.', '-');
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
			or(
				and(
					inArray(cafeteriaMenuOfferings.cafeteriaCode, ['jinri', 'faculty']),
					gte(cafeteriaMenuOfferings.menuDate, firstDate),
					lte(cafeteriaMenuOfferings.menuDate, lastDate)
				),
				and(
					eq(cafeteriaMenuOfferings.cafeteriaCode, 'foodcourt'),
					eq(cafeteriaMenuOfferings.menuDate, todayDate)
				)
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
					voterHash: cafeteriaMenuVotes.voterHash,
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
			(vote): vote is { offeringId: string; voterHash: string; reaction: 'like' | 'dislike' } =>
				vote.reaction === 'like' || vote.reaction === 'dislike'
		),
		voterHash
	);

	return Object.fromEntries(
		currentOfferings.map((offering) => {
			const summary = summaries.get(offering.id) ?? {
				todayLikes: 0,
				todayDislikes: 0,
				historicalLikes: 0,
				historicalDislikes: 0,
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

export async function hashVoterId(voterId: string) {
	const bytes = new TextEncoder().encode(voterId);
	const hash = await crypto.subtle.digest('SHA-256', bytes);
	return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function getOrCreateVoterHash(voterId?: string) {
	const id = voterId || crypto.randomUUID();
	return { voterId: id, voterHash: await hashVoterId(id) };
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
