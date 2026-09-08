import { createDb } from '$lib/server/db';
import { cafeteriaMenuItems, cafeteriaMenuOfferings } from '$lib/server/db/schema';
import { and, gte, inArray, lte, sql } from 'drizzle-orm';
import { staticFoodCourtVendors } from '$lib/domain/cafeterias';
import {
	normalizeMenuName,
	type CafeteriaMealSlot
} from '$lib/domain/cafeteria-feedback';
import type { WeeklyMenu } from '$lib/domain/places';

export type CafeteriaOfferingInput = {
	cafeteriaCode: 'jinri' | 'faculty' | 'foodcourt';
	menuDate: string;
	mealSlot: CafeteriaMealSlot;
	menuSection: string;
	displayName: string;
	normalizedName: string;
	isVotable: boolean;
};

const JINRI_SECTIONS: Array<{
	section: 'breakfast' | 'korean' | 'special' | 'snack' | 'dinner';
	mealSlot: CafeteriaMealSlot;
}> = [
	{ section: 'breakfast', mealSlot: 'breakfast' },
	{ section: 'korean', mealSlot: 'lunch' },
	{ section: 'special', mealSlot: 'lunch' },
	{ section: 'snack', mealSlot: 'lunch' },
	{ section: 'dinner', mealSlot: 'dinner' }
];

const FACULTY_SECTIONS: Array<{ section: 'lunch'; mealSlot: CafeteriaMealSlot }> = [
	{ section: 'lunch', mealSlot: 'lunch' }
];

function toDatabaseDate(menuDate: string) {
	return menuDate.replaceAll('.', '-');
}

function createOffering(
	cafeteriaCode: 'jinri' | 'faculty',
	menuDate: string,
	mealSlot: CafeteriaMealSlot,
	menuSection: string,
	displayName: string
): CafeteriaOfferingInput {
	const normalizedName = normalizeMenuName(displayName);
	return {
		cafeteriaCode,
		menuDate: toDatabaseDate(menuDate),
		mealSlot,
		menuSection,
		displayName,
		normalizedName,
		isVotable: normalizedName.length > 0
	};
}

export function flattenWeeklyMenu(weeklyMenu: WeeklyMenu): CafeteriaOfferingInput[] {
	const offerings: CafeteriaOfferingInput[] = [];

	for (const day of weeklyMenu.days) {
		for (const { section, mealSlot } of JINRI_SECTIONS) {
			for (const menuName of day.student[section]) {
				offerings.push(createOffering('jinri', day.date, mealSlot, section, menuName));
			}
		}

		for (const { section, mealSlot } of FACULTY_SECTIONS) {
			for (const menuName of day.faculty[section]) {
				offerings.push(createOffering('faculty', day.date, mealSlot, section, menuName));
			}
		}
	}

	return offerings;
}

export function flattenFoodCourtMenu(menuDate: string): CafeteriaOfferingInput[] {
	return staticFoodCourtVendors.flatMap((vendor) =>
		vendor.menus.map((menu) => ({
			cafeteriaCode: 'foodcourt' as const,
			menuDate,
			mealSlot: 'all_day' as const,
			menuSection: vendor.id,
			displayName: menu.name,
			normalizedName: normalizeMenuName(menu.name),
			isVotable: true
		}))
	);
}

export function shouldSyncWeeklyMenu(expectedOfferingCount: number, persistedOfferingCount: number) {
	return persistedOfferingCount < expectedOfferingCount;
}

function offeringIdentity(item: {
	cafeteriaCode: string; menuDate: string; mealSlot: string; menuSection: string; displayName: string;
}) {
	return JSON.stringify([item.cafeteriaCode, item.menuDate, item.mealSlot,
		item.menuSection, normalizeMenuName(item.displayName)]);
}

export async function syncWeeklyCafeteriaMenu(databaseUrl: string | undefined, weeklyMenu: WeeklyMenu) {
	return syncCafeteriaOfferings(databaseUrl, flattenWeeklyMenu(weeklyMenu));
}

export async function ensureWeeklyCafeteriaMenu(databaseUrl: string | undefined, weeklyMenu: WeeklyMenu) {
	if (!databaseUrl) return 0;

	const expectedOfferings = flattenWeeklyMenu(weeklyMenu);
	const dates = weeklyMenu.days.map((day) => toDatabaseDate(day.date));
	const firstDate = dates[0];
	const lastDate = dates.at(-1);
	if (!firstDate || !lastDate) return 0;

	const db = createDb(databaseUrl);
	const persistedOfferings = await db
		.select({
			cafeteriaCode: cafeteriaMenuOfferings.cafeteriaCode,
			menuDate: cafeteriaMenuOfferings.menuDate,
			mealSlot: cafeteriaMenuOfferings.mealSlot,
			menuSection: cafeteriaMenuOfferings.menuSection,
			displayName: cafeteriaMenuOfferings.displayName
		})
		.from(cafeteriaMenuOfferings)
		.where(
			and(
				inArray(cafeteriaMenuOfferings.cafeteriaCode, ['jinri', 'faculty']),
				gte(cafeteriaMenuOfferings.menuDate, firstDate),
				lte(cafeteriaMenuOfferings.menuDate, lastDate)
			)
		);

	const saved = new Set(persistedOfferings.map(offeringIdentity));
	if (expectedOfferings.every((item) => saved.has(offeringIdentity(item)))) return 0;
	return syncCafeteriaOfferings(databaseUrl, expectedOfferings);
}

export async function syncFoodCourtMenu(databaseUrl: string | undefined, menuDate: string) {
	return syncCafeteriaOfferings(databaseUrl, flattenFoodCourtMenu(menuDate));
}

export async function syncCafeteriaOfferings(
	databaseUrl: string | undefined,
	offerings: CafeteriaOfferingInput[],
	db = databaseUrl ? createDb(databaseUrl) : undefined
) {
	if (!db || offerings.length === 0) return 0;
	const itemKey = (item: { cafeteriaCode: string; normalizedName: string }) =>
		JSON.stringify([item.cafeteriaCode, item.normalizedName]);
	// 같은 메뉴가 여러 날짜에 나와도 한 INSERT에서 같은 행을 두 번 갱신하지 않는다.
	const uniqueItems = [...new Map(offerings.map((item) => [itemKey(item), {
		cafeteriaCode: item.cafeteriaCode,
		normalizedName: item.normalizedName,
		displayName: item.displayName
	}])).values()];
	const menuItems = await db.insert(cafeteriaMenuItems).values(uniqueItems).onConflictDoUpdate({
		target: [cafeteriaMenuItems.cafeteriaCode, cafeteriaMenuItems.normalizedName],
		set: { displayName: sql`excluded.display_name` }
	}).returning({
		id: cafeteriaMenuItems.id,
		cafeteriaCode: cafeteriaMenuItems.cafeteriaCode,
		normalizedName: cafeteriaMenuItems.normalizedName
	});
	const ids = new Map(menuItems.map((item) => [itemKey(item), item.id]));
	const uniqueOfferings = [...new Map(offerings.map((offering) => {
		const menuItemId = ids.get(itemKey(offering));
		if (!menuItemId) throw new Error('학식 메뉴 식별자를 찾지 못했습니다.');
		return [JSON.stringify([menuItemId, offering.menuDate, offering.mealSlot, offering.menuSection]), {
			menuItemId,
			cafeteriaCode: offering.cafeteriaCode,
			menuDate: offering.menuDate,
			mealSlot: offering.mealSlot,
			menuSection: offering.menuSection,
			displayName: offering.displayName,
			isVotable: offering.isVotable,
			source: 'crawler'
		}] as const;
	})).values()];
	await db.insert(cafeteriaMenuOfferings).values(uniqueOfferings).onConflictDoUpdate({
		target: [cafeteriaMenuOfferings.menuItemId, cafeteriaMenuOfferings.menuDate,
			cafeteriaMenuOfferings.mealSlot, cafeteriaMenuOfferings.menuSection],
		set: { displayName: sql`excluded.display_name`, isVotable: sql`excluded.is_votable`,
			source: 'crawler', updatedAt: new Date() }
	});
	return uniqueOfferings.length;
}
