import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';

import { cafeteriaCodes, type CafeteriaCode } from '$lib/domain/cafeteria-operating-hours';
import { getCafeteriaOperatingHours } from '$lib/server/cafeteria-operating-hours';

function isCafeteriaCode(value: string | null): value is CafeteriaCode {
	return value !== null && (cafeteriaCodes as readonly string[]).includes(value);
}

export async function GET({ url }: { url: URL }) {
	const cafeteriaCode = url.searchParams.get('cafeteria');
	if (!isCafeteriaCode(cafeteriaCode)) {
		return json({ message: '유효하지 않은 식당입니다.' }, { status: 400 });
	}

	const operatingHours = await getCafeteriaOperatingHours(env.DATABASE_URL);
	return json({
		operatingHours: operatingHours.filter((row) => row.cafeteriaCode === cafeteriaCode)
	});
}
