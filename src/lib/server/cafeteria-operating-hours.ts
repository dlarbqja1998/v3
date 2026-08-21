import { asc, eq } from 'drizzle-orm';

import {
	cafeteriaOperatingHourDefaults,
	type CafeteriaCode,
	type CafeteriaOperatingHour
} from '$lib/domain/cafeteria-operating-hours';
import { createDb } from '$lib/server/db';
import { cafeteriaOperatingHours } from '$lib/server/db/schema';

function asDaysOfWeek(value: unknown): number[] {
	if (!Array.isArray(value)) return [];
	return value.filter((day): day is number => Number.isInteger(day) && day >= 0 && day <= 6);
}

function asTime(value: string): string {
	return value.slice(0, 5);
}

function toOperatingHour(row: typeof cafeteriaOperatingHours.$inferSelect): CafeteriaOperatingHour | null {
	if (row.cafeteriaCode !== 'jinri' && row.cafeteriaCode !== 'faculty' && row.cafeteriaCode !== 'foodcourt') {
		return null;
	}

	return {
		id: row.id,
		cafeteriaCode: row.cafeteriaCode,
		label: row.label,
		daysOfWeek: asDaysOfWeek(row.daysOfWeek),
		opensAt: asTime(row.opensAt),
		closesAt: asTime(row.closesAt),
		displayOrder: row.displayOrder
	};
}

export async function getCafeteriaOperatingHours(databaseUrl?: string): Promise<CafeteriaOperatingHour[]> {
	if (!databaseUrl) return cafeteriaOperatingHourDefaults;

	try {
		const db = createDb(databaseUrl);
		const rows = await db
			.select()
			.from(cafeteriaOperatingHours)
			.orderBy(asc(cafeteriaOperatingHours.cafeteriaCode), asc(cafeteriaOperatingHours.displayOrder));
		return rows.map(toOperatingHour).filter((row): row is CafeteriaOperatingHour => row !== null);
	} catch (error) {
		console.error('학식 운영시간을 불러오지 못해 기본값으로 대체합니다.', error);
		return cafeteriaOperatingHourDefaults;
	}
}

export async function replaceCafeteriaOperatingHours(
	databaseUrl: string,
	cafeteriaCode: CafeteriaCode,
	rows: Array<Pick<CafeteriaOperatingHour, 'label' | 'daysOfWeek' | 'opensAt' | 'closesAt'>>
) {
	const db = createDb(databaseUrl);
	await db.delete(cafeteriaOperatingHours).where(eq(cafeteriaOperatingHours.cafeteriaCode, cafeteriaCode));
	if (rows.length === 0) return;

	await db.insert(cafeteriaOperatingHours).values(
		rows.map((row, index) => ({
			cafeteriaCode,
			label: row.label.trim(),
			daysOfWeek: [...new Set(row.daysOfWeek)].sort((a, b) => a - b),
			opensAt: row.opensAt,
			closesAt: row.closesAt,
			displayOrder: index + 1,
			updatedAt: new Date()
		}))
	);
}
