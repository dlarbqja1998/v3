export const cafeteriaCodes = ['jinri', 'faculty', 'foodcourt'] as const;

export type CafeteriaCode = (typeof cafeteriaCodes)[number];

export type CafeteriaOperatingHour = {
	id: string;
	cafeteriaCode: CafeteriaCode;
	label: string;
	daysOfWeek: number[];
	opensAt: string;
	closesAt: string;
	displayOrder: number;
};

export type CafeteriaOperatingHoursInput = {
	cafeteriaCode: CafeteriaCode | string;
	rows: Array<Pick<CafeteriaOperatingHour, 'label' | 'daysOfWeek' | 'opensAt' | 'closesAt'>>;
};

type ValidCafeteriaOperatingHoursInput = Omit<CafeteriaOperatingHoursInput, 'cafeteriaCode'> & {
	cafeteriaCode: CafeteriaCode;
};

type OperatingStatus =
	| { kind: 'open'; label: '영업중' }
	| { kind: 'closed'; label: '영업 종료' }
	| { kind: 'unregistered'; label: '운영시간 미등록' };

type SessionUser = { id: number; role: string } | null | undefined;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// 고려대학교 세종캠퍼스 주간 식단표(8028)에서 2026-09-04 확인한 진리관 운영시간.
// 교직원식당은 공식 식단표에 시간이 없어 확인 가능한 값만 기본값으로 둔다.
export const cafeteriaOperatingHourDefaults: CafeteriaOperatingHour[] = [
	{
		id: 'jinri-breakfast',
		cafeteriaCode: 'jinri',
		label: '조식',
		daysOfWeek: [1, 2, 3, 4, 5],
		opensAt: '07:30',
		closesAt: '09:00',
		displayOrder: 1
	},
	{
		id: 'jinri-lunch',
		cafeteriaCode: 'jinri',
		label: '중식',
		daysOfWeek: [1, 2, 3, 4, 5],
		opensAt: '11:30',
		closesAt: '13:30',
		displayOrder: 2
	},
	{
		id: 'jinri-dinner',
		cafeteriaCode: 'jinri',
		label: '석식',
		daysOfWeek: [1, 2, 3, 4, 5],
		opensAt: '17:00',
		closesAt: '18:30',
		displayOrder: 3
	}
];

function isCafeteriaCode(value: string): value is CafeteriaCode {
	return (cafeteriaCodes as readonly string[]).includes(value);
}

function toMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

export function getCafeteriaOperatingStatus(
	rows: CafeteriaOperatingHour[],
	now: Date
): OperatingStatus {
	if (rows.length === 0) {
		return { kind: 'unregistered', label: '운영시간 미등록' };
	}

	const currentMinutes = now.getHours() * 60 + now.getMinutes();
	const currentDay = now.getDay();
	const isOpen = rows.some(
		(row) =>
			row.daysOfWeek.includes(currentDay) &&
			toMinutes(row.opensAt) <= currentMinutes &&
			currentMinutes < toMinutes(row.closesAt)
	);

	return isOpen ? { kind: 'open', label: '영업중' } : { kind: 'closed', label: '영업 종료' };
}

export function validateOperatingHoursInput(
	input: CafeteriaOperatingHoursInput
): { ok: true; value: ValidCafeteriaOperatingHoursInput } | { ok: false; message: string } {
	if (!isCafeteriaCode(input.cafeteriaCode)) {
		return { ok: false, message: '유효하지 않은 식당입니다.' };
	}

	if (input.rows.length > 8) {
		return { ok: false, message: '운영시간은 최대 8개까지 등록할 수 있습니다.' };
	}

	const seenRows = new Set<string>();
	for (const row of input.rows) {
		const label = row.label.trim();
		if (!label || row.daysOfWeek.length === 0 || !timePattern.test(row.opensAt) || !timePattern.test(row.closesAt)) {
			return { ok: false, message: '운영시간의 항목, 요일, 시간을 모두 입력해 주세요.' };
		}

		if (toMinutes(row.closesAt) <= toMinutes(row.opensAt)) {
			return { ok: false, message: '종료 시간은 시작 시간보다 늦어야 합니다.' };
		}

		const orderedDays = [...new Set(row.daysOfWeek)].sort((a, b) => a - b);
		if (orderedDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
			return { ok: false, message: '유효하지 않은 요일입니다.' };
		}

		const rowKey = `${label}|${orderedDays.join(',')}|${row.opensAt}|${row.closesAt}`;
		if (seenRows.has(rowKey)) {
			return { ok: false, message: '중복된 운영시간입니다.' };
		}
		seenRows.add(rowKey);
	}

	return { ok: true, value: { ...input, cafeteriaCode: input.cafeteriaCode } };
}

export function canEditCafeteriaOperatingHours(user: SessionUser): boolean {
	return user?.role === 'admin';
}
