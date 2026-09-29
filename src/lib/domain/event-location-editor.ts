import type { CampusSpot } from './campus-spots';
import { getEventAreaCenter, isEventCoordinate, parseCampusEventLocation, type CampusEventLocation } from './event-locations';

export type EventLocationInput = {
	locationName: string;
	latitude: number;
	longitude: number;
	location: CampusEventLocation;
};

/** 지도 기본 중심을 실수로 저장하지 않고, 선택한 위치만 저장한다. */
export function parseEventLocationInput(form: FormData, spots: CampusSpot[] = []):
	{ ok: true; value: EventLocationInput } | { ok: false; message: string } {
	const locationName = String(form.get('locationName') ?? '').trim();
	if (!locationName || locationName.length > 160) return { ok: false, message: '장소명을 1~160자로 입력해 주세요.' };
	if (form.get('positionChosen') !== 'true') return { ok: false, message: '지도에서 행사 위치를 먼저 지정해 주세요.' };
	let location: CampusEventLocation | null;
	try { location = parseCampusEventLocation(JSON.parse(String(form.get('location') ?? ''))); }
	catch { location = null; }
	if (!location) return { ok: false, message: '핀, 범위 또는 건물을 올바르게 선택해 주세요.' };
	let point;
	if (location.type === 'area') point = getEventAreaCenter(location.boundary);
	else if (location.type === 'building') {
		const buildings = location.buildingIds.map((id) => spots.find((spot) => spot.id === id && spot.type === 'building'));
		if (buildings.some((spot) => !spot)) return { ok: false, message: '선택한 건물을 다시 확인해 주세요.' };
		point = buildings[0]!.center;
	} else {
		const latitude = String(form.get('latitude') ?? '').trim();
		const longitude = String(form.get('longitude') ?? '').trim();
		if (!latitude || !longitude) return { ok: false, message: '핀 위치의 위도와 경도를 확인해 주세요.' };
		point = { latitude: Number(latitude), longitude: Number(longitude) };
	}
	if (!isEventCoordinate(point)) return { ok: false, message: '지도 좌표를 확인해 주세요.' };
	return { ok: true, value: { locationName, ...point, location } };
}
