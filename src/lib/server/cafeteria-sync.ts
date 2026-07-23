import { createDb } from '$lib/server/db';
import { cafeteriaMenuItems, cafeteriaMenuOfferings } from '$lib/server/db/schema';
import { staticFoodCourtVendors } from '$lib/domain/cafeterias';
import {
	isVotableMenu,
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

const FACULTY_SECTIONS: Array<{ section: 'lunch' | 'dinner'; mealSlot: CafeteriaMealSlot }> = [
	{ section: 'lunch', mealSlot: 'lunch' },
	{ section: 'dinner', mealSlot: 'dinner' }
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
	return {
		cafeteriaCode,
		menuDate: toDatabaseDate(menuDate),
		mealSlot,
		menuSection,
		displayName,
		normalizedName: normalizeMenuName(displayName),
		isVotable: isVotableMenu(displayName)
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

export async function syncWeeklyCafeteriaMenu(databaseUrl: string | undefined, weeklyMenu: WeeklyMenu) {
	return syncCafeteriaOfferings(databaseUrl, flattenWeeklyMenu(weeklyMenu));
}

export async function syncFoodCourtMenu(databaseUrl: string | undefined, menuDate: string) {
	return syncCafeteriaOfferings(databaseUrl, flattenFoodCourtMenu(menuDate));
}

async function syncCafeteriaOfferings(
	databaseUrl: string | undefined,
	offerings: CafeteriaOfferingInput[]
) {
	if (!databaseUrl) return 0;

	const db = createDb(databaseUrl);

	for (const offering of offerings) {
		const [menuItem] = await db
			.insert(cafeteriaMenuItems)
			.values({
				cafeteriaCode: offering.cafeteriaCode,
				normalizedName: offering.normalizedName,
				displayName: offering.displayName
			})
			.onConflictDoUpdate({
				target: [cafeteriaMenuItems.cafeteriaCode, cafeteriaMenuItems.normalizedName],
				set: { displayName: offering.displayName }
			})
			.returning({ id: cafeteriaMenuItems.id });

		if (!menuItem) continue;

		await db
			.insert(cafeteriaMenuOfferings)
			.values({
				menuItemId: menuItem.id,
				cafeteriaCode: offering.cafeteriaCode,
				menuDate: offering.menuDate,
				mealSlot: offering.mealSlot,
				menuSection: offering.menuSection,
				displayName: offering.displayName,
				isVotable: offering.isVotable,
				source: 'crawler'
			})
			.onConflictDoUpdate({
				target: [
					cafeteriaMenuOfferings.menuItemId,
					cafeteriaMenuOfferings.menuDate,
					cafeteriaMenuOfferings.mealSlot,
					cafeteriaMenuOfferings.menuSection
				],
				set: {
					displayName: offering.displayName,
					isVotable: offering.isVotable,
					source: 'crawler',
					updatedAt: new Date()
				}
			});
	}

	return offerings.length;
}
