import { normalizeBuildingName, type CampusFacility, type CampusFacilityLocation } from './campus-facilities';
import { isFacilityCategorySlug } from './facility-categories';
import type { Place } from './places';

function compact(value: string) {
	return value.toLocaleLowerCase('ko').replace(/[\s.·()\-]/g, '');
}

function locationsForPlace(place: Place, source: CampusFacility | undefined, buildings: string[]): CampusFacilityLocation[] {
	const guide = place.locationGuide?.trim();
	if (!guide) return source?.locations ?? [{ building: null, label: '위치 확인 중', floor: null }];
	const building = buildings.find((name) => normalizeBuildingName(guide).includes(name));
	const original = source?.locations.find((location) => location.building && normalizeBuildingName(location.building) === building);
	// 건물명만 있는 기존 핀에는 확인된 층·호실을 보충한다.
	if (original && normalizeBuildingName(guide) === building) return [{ ...original, building }];
	// 교직원 식당과 I Park처럼 위치란에 상호만 있는 경우에는 조사된 건물 안내를 사용한다.
	if (!building && source && compact(guide).includes(compact(place.name))) return source.locations;
	return [{ building: building ?? null, label: guide, floor: guide.match(/(?:지하\s*)?\d+\s*층/)?.[0] ?? null }];
}

/** 확인된 ID 연결만 사용한다. 동명 지점이나 같은 건물의 다른 시설은 자동 병합하지 않는다. */
export function composeCampusFacilityCatalog(
	sources: CampusFacility[], places: Place[], links: Readonly<Record<string, string>>
): CampusFacility[] {
	const sourceByPlace = new Map(sources.flatMap((source) => links[source.id] ? [[links[source.id], source] as const] : []));
	const buildings = [...new Set(sources.flatMap((source) => source.locations.flatMap((location) =>
		location.building ? [normalizeBuildingName(location.building)] : [])))].sort((a, b) => b.length - a.length);
	const existing = places.filter((place) => place.scope === 'campus' && place.isVisible &&
		isFacilityCategorySlug(place.categorySlug) &&
		(place.type === 'facility' || place.type === 'cafe' || place.type === 'restaurant' || place.type === 'cafeteria'));

	return [
		// 연결된 핀이 숨겨지거나 삭제됐으면 조사 자료로 다시 노출하지 않는다.
		...sources.filter((source) => !links[source.id]),
		...existing.map((place): CampusFacility => {
			const source = sourceByPlace.get(place.id);
			const description = place.description.trim();
			return {
				id: place.id, name: place.name, place,
				keywords: [...new Set([place.categoryName, source?.name ?? '', ...(source?.keywords ?? [])].filter(Boolean))],
				purpose: ['cafe', 'restaurant'].includes(place.categorySlug) ? 'food' : 'daily',
				sourceCategory: place.categoryName,
				description: [...new Set([
					description && compact(description) !== compact(place.name) ? description : '', source?.description ?? ''
				].filter(Boolean))].join('\n'),
				audience: source?.audience ?? '',
				locations: locationsForPlace(place, source, buildings),
				phone: place.phone?.trim() || source?.phone || '',
				hours: place.operatingHours?.trim() || source?.hours || null,
				officialUrl: source?.officialUrl ?? '', sourceUrl: source?.sourceUrl ?? '',
				checkedAt: source?.checkedAt ?? '', priority: source?.priority ?? false,
				details: source?.details, actions: source?.actions
			};
		})
	];
}
