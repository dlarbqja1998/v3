export const EVENT_CATEGORIES = ['축제', '공연', '전시', '박람회', '강연', '체험', '기타'] as const;

export type CampusEventCategory = (typeof EVENT_CATEGORIES)[number];
export type CampusEventStatus = 'ongoing' | 'upcoming' | 'ended';

export type CampusEventTimeRange = {
	startsAt: Date;
	endsAt: Date;
};

export type PublicCampusEventCandidate = CampusEventTimeRange & {
	isVisible: boolean;
};

export type CampusEventInput = {
	title: string;
	category: CampusEventCategory;
	organizer: string;
	description: string;
	externalUrl: string | null;
	startsAt: Date;
	endsAt: Date;
	locationName: string;
	latitude: number;
	longitude: number;
	isVisible: boolean;
};

export type EventInputResult =
	| { ok: true; value: CampusEventInput }
	| { ok: false; message: string };

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function getCampusEventStatus(
	event: CampusEventTimeRange,
	now = new Date()
): CampusEventStatus {
	if (now < event.startsAt) return 'upcoming';
	if (now <= event.endsAt) return 'ongoing';
	return 'ended';
}

export function getPublicCampusEvents<T extends PublicCampusEventCandidate>(events: T[], now = new Date()) {
	const latestUpcomingStart = now.getTime() + SEVEN_DAYS_MS;

	return events
		.filter((event) => {
			if (!event.isVisible) return false;
			const status = getCampusEventStatus(event, now);
			return (
				status === 'ongoing' ||
				(status === 'upcoming' && event.startsAt.getTime() <= latestUpcomingStart)
			);
		})
		.sort((a, b) => {
			const aStatus = getCampusEventStatus(a, now);
			const bStatus = getCampusEventStatus(b, now);
			if (aStatus !== bStatus) return aStatus === 'ongoing' ? -1 : 1;
			return aStatus === 'ongoing'
				? a.endsAt.getTime() - b.endsAt.getTime()
				: a.startsAt.getTime() - b.startsAt.getTime();
		});
}

export function getInitialCampusEventTab(
	events: CampusEventTimeRange[],
	now = new Date()
): 'ongoing' | 'upcoming' {
	return events.some((event) => getCampusEventStatus(event, now) === 'ongoing')
		? 'ongoing'
		: 'upcoming';
}

function isCampusEventCategory(value: string): value is CampusEventCategory {
	return EVENT_CATEGORIES.includes(value as CampusEventCategory);
}

function parseDate(value: FormDataEntryValue | null) {
	const parsed = new Date(String(value ?? ''));
	return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseCoordinate(value: FormDataEntryValue | null) {
	const raw = String(value ?? '').trim();
	if (!raw) return null;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseExternalUrl(value: FormDataEntryValue | null) {
	const raw = String(value ?? '').trim();
	if (!raw) return { ok: true as const, value: null };
	if (raw.length > 2_048) return { ok: false as const };
	try {
		const url = new URL(raw);
		if (!['http:', 'https:'].includes(url.protocol)) return { ok: false as const };
		return { ok: true as const, value: url.toString() };
	} catch {
		return { ok: false as const };
	}
}

export function normalizeCampusEventInput(
	formData: FormData,
	options: { coverImageCount?: number } = {}
): EventInputResult {
	const title = String(formData.get('title') ?? '').trim();
	const category = String(formData.get('category') ?? '').trim();
	const organizer = String(formData.get('organizer') ?? '').trim();
	const description = String(formData.get('description') ?? '').trim();
	const externalUrl = parseExternalUrl(formData.get('externalUrl'));
	const startsAt = parseDate(formData.get('startsAt'));
	const endsAt = parseDate(formData.get('endsAt'));
	const locationName = String(formData.get('locationName') ?? '').trim();
	const latitude = parseCoordinate(formData.get('latitude'));
	const longitude = parseCoordinate(formData.get('longitude'));
	const isVisible = ['on', 'true', '1'].includes(String(formData.get('isVisible') ?? ''));

	if (title.length < 2 || title.length > 120) {
		return { ok: false, message: '행사 제목을 2~120자로 입력해 주세요.' };
	}
	if (!isCampusEventCategory(category)) {
		return { ok: false, message: '행사 카테고리를 확인해 주세요.' };
	}
	if (organizer.length < 2 || organizer.length > 120) {
		return { ok: false, message: '주최 정보를 2~120자로 입력해 주세요.' };
	}
	if (description.length < 5 || description.length > 10_000) {
		return { ok: false, message: '행사 설명을 5~10,000자로 입력해 주세요.' };
	}
	if (!externalUrl.ok) {
		return { ok: false, message: '안내 링크는 http 또는 https 주소로 입력해 주세요.' };
	}
	if (!startsAt || !endsAt) {
		return { ok: false, message: '행사 시작과 종료 일시를 확인해 주세요.' };
	}
	if (endsAt <= startsAt) {
		return { ok: false, message: '종료 일시는 시작 일시보다 늦어야 합니다.' };
	}
	if (locationName.length < 1 || locationName.length > 160) {
		return { ok: false, message: '행사 장소를 입력해 주세요.' };
	}
	if (latitude === null || latitude < -90 || latitude > 90 || longitude === null || longitude < -180 || longitude > 180) {
		return { ok: false, message: '지도에서 행사 위치를 지정해 주세요.' };
	}
	if (isVisible && (options.coverImageCount ?? 0) < 1) {
		return { ok: false, message: '공개 행사에는 대표 이미지가 필요합니다.' };
	}

	return {
		ok: true,
		value: {
			title,
			category,
			organizer,
			description,
			externalUrl: externalUrl.value,
			startsAt,
			endsAt,
			locationName,
			latitude,
			longitude,
			isVisible
		}
	};
}
