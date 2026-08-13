import type { CampusCoordinate } from '$lib/domain/campus-spots';

export type EditableZone = {
	id: string;
	name: string;
	slug: string;
	center: CampusCoordinate;
	boundary: CampusCoordinate[];
	displayOrder: number;
	isVisible: boolean;
};

type ZoneRow = {
	id: string;
	name: string;
	slug: string;
	centerLatitude: number;
	centerLongitude: number;
	polygon: unknown;
	displayOrder: number;
	isVisible: boolean;
};

type ZoneNameCandidate = {
	id: string;
	name: string;
};

export type ZoneEditorInput =
	| { ok: true; name: string; boundary: CampusCoordinate[] }
	| { ok: false; message: string };

export function normalizeZoneName(value: unknown) {
	return typeof value === 'string' ? value.trim() : '';
}

export function normalizeZoneBoundary(value: unknown): CampusCoordinate[] {
	if (!Array.isArray(value) || value.length < 3) return [];

	const boundary = value.filter((point): point is CampusCoordinate => {
		if (typeof point !== 'object' || point === null) return false;
		const latitude = (point as CampusCoordinate).latitude;
		const longitude = (point as CampusCoordinate).longitude;
		return (
			Number.isFinite(latitude) &&
			Number.isFinite(longitude) &&
			latitude >= -90 &&
			latitude <= 90 &&
			longitude >= -180 &&
			longitude <= 180
		);
	});

	return boundary.length === value.length ? boundary : [];
}

export function parseZoneEditorInput(nameValue: unknown, boundaryJson: unknown): ZoneEditorInput {
	const name = normalizeZoneName(nameValue);
	if (!name) return { ok: false, message: '구역 이름을 입력해 주세요.' };
	if (name.length > 80) {
		return { ok: false, message: '구역 이름은 80자 이내로 입력해 주세요.' };
	}

	if (typeof boundaryJson !== 'string') {
		return { ok: false, message: '구역 경계 데이터가 올바르지 않습니다.' };
	}

	let boundary: CampusCoordinate[] = [];
	try {
		boundary = normalizeZoneBoundary(JSON.parse(boundaryJson));
	} catch {
		return { ok: false, message: '구역 경계 데이터가 올바르지 않습니다.' };
	}

	if (boundary.length < 3) {
		return { ok: false, message: '지도에서 구역 경계점을 3개 이상 지정해 주세요.' };
	}

	return { ok: true, name, boundary };
}

export function toEditableZone(row: ZoneRow): EditableZone {
	return {
		id: row.id,
		name: row.name,
		slug: row.slug,
		center: { latitude: row.centerLatitude, longitude: row.centerLongitude },
		boundary: normalizeZoneBoundary(row.polygon),
		displayOrder: row.displayOrder,
		isVisible: row.isVisible
	};
}

export function createZoneSlug(uuid: string) {
	return `zone-${uuid.split('-')[0].toLowerCase()}`;
}

export function isZoneNameTaken(
	zones: ZoneNameCandidate[],
	name: string,
	excludedId = ''
) {
	const normalizedName = normalizeZoneName(name).toLocaleLowerCase();
	return zones.some(
		(zone) =>
			zone.id !== excludedId && normalizeZoneName(zone.name).toLocaleLowerCase() === normalizedName
	);
}
