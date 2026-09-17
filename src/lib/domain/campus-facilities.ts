import type { CampusSpot } from './campus-spots';
import type { Place } from './places';
import { FACILITY_CATEGORIES } from './facility-categories';

export const CAMPUS_FACILITY_PURPOSES = [
	{ id: 'all', label: '전체' },
	{ id: 'administration', label: '행정·지원' },
	{ id: 'learning', label: '학습·진로' },
	{ id: 'care', label: '상담·보건' },
	{ id: 'daily', label: '생활·편의' },
	{ id: 'food', label: '식당·카페' }
] as const;

export type CampusFacilityPurpose = (typeof CAMPUS_FACILITY_PURPOSES)[number]['id'];
export type CampusFacilityLocation = {
	building: string | null;
	label: string;
	floor: string | null;
};
export type CampusFacility = {
	id: string;
	name: string;
	keywords: string[];
	purpose: Exclude<CampusFacilityPurpose, 'all'>;
	sourceCategory: string;
	description: string;
	audience: string;
	locations: CampusFacilityLocation[];
	phone: string;
	hours: string | null;
	officialUrl: string;
	sourceUrl: string;
	checkedAt: string;
	priority: boolean;
	details?: Array<{ title: string; items: string[] }>;
	actions?: Array<{ label: string; url: string }>;
	/** 기존 관리자 핀과 연결한 장소. ID·좌표·아이콘은 이 레코드를 그대로 사용한다. */
	place?: Place;
	membership?: import('./restaurants').KuMembership;
};

export type CampusDirectoryView = {
	purpose: CampusFacilityPurpose;
	query: string;
	building: string;
	facilityId?: string;
	returnSpotId: string;
	listExpanded?: boolean;
	category?: string;
};

export function normalizeBuildingName(name: string) {
	return name.replace(/\s+/g, '').replaceAll('호익플라자', '호익프라자')
		.replaceAll('제1과학기술관', '과학기술1관')
		.replaceAll('세종학생군사교육단', '학군단');
}

export function facilityIsInBuilding(facility: CampusFacility, building: string) {
	return facility.locations.some((location) => location.building &&
		normalizeBuildingName(location.building) === normalizeBuildingName(building));
}

function searchable(value: string) {
	return value.toLocaleLowerCase('ko').replace(/[\s·\-()]/g, '');
}

export function filterCampusFacilities(
	facilities: CampusFacility[],
	{ purpose = 'all', query = '', building = '', category = 'all' }: Partial<CampusDirectoryView> = {}
) {
	const terms = query.trim().split(/\s+/).filter(Boolean).map(searchable);
	const featuredFacilityId = normalizeBuildingName(building) === '학술정보원' ? 'FAC-015' : '';
	return facilities.filter((facility) => {
		if (category === 'student-support' && facility.place) return false;
		if (category !== 'all' && category !== 'student-support' && facility.place?.categorySlug !== category) return false;
		if (purpose !== 'all' && facility.purpose !== purpose) return false;
		if (building && !facilityIsInBuilding(facility, building)) return false;
		const text = searchable([facility.name, ...facility.keywords, facility.description,
			...(facility.details ?? []).flatMap((section) => [section.title, ...section.items]),
			...facility.locations.flatMap((location) => [location.label, normalizeBuildingName(location.building ?? '')])].join(' '));
		return terms.every((term) => text.includes(term));
	}).sort((a, b) => Number(b.id === featuredFacilityId) - Number(a.id === featuredFacilityId) ||
		Number(b.priority) - Number(a.priority) ||
		(a.place?.displayPriority ?? 0) - (b.place?.displayPriority ?? 0) || a.name.localeCompare(b.name, 'ko'));
}

export function getCampusDirectoryTitle(view: Partial<CampusDirectoryView>) {
	if (view.category === 'student-support') return '학생지원';
	return FACILITY_CATEGORIES.find((category) => category.slug === view.category)?.name ?? '시설 안내';
}

export function getFacilityBuildingSpots(facility: CampusFacility, spots: CampusSpot[]) {
	return spots.filter((spot) => spot.type === 'building' && facilityIsInBuilding(facility, spot.name));
}

/** 실내 시설의 위치는 출입구가 아니라 확인된 건물 중심으로 안내한다. */
export function getCampusFacilityMarkers(facilities: CampusFacility[], spots: CampusSpot[], building = ''): Place[] {
	const pins = facilities.flatMap((facility) => facility.place && facility.place.isVisible &&
		(!building || facilityIsInBuilding(facility, building)) ? [facility.place] : []);
	const buildingPins = spots.filter((spot) => spot.type === 'building' && (!building || normalizeBuildingName(spot.name) === normalizeBuildingName(building))).flatMap((spot): Place[] => {
		const matches = facilities.filter((facility) => !facility.place && facilityIsInBuilding(facility, spot.name));
		if (!matches.length) return [];
		return [{
			id: `campus-facilities:${spot.id}`, type: 'facility', name: `${spot.name} · ${matches.length}`,
			categorySlug: 'student-support', categoryName: '학생지원', zoneId: null, scope: 'campus',
			latitude: spot.center.latitude, longitude: spot.center.longitude,
			locationGuide: `${spot.name} 건물 위치`, operatingHours: null, phone: null,
			description: `${matches.length}개 시설 안내`, icon: 'administration', isVisible: true, displayPriority: 0
		}];
	});
	return [...pins, ...buildingPins];
}

/** 교내 단축 번호나 범위를 임의로 확장하지 않는다. 완전한 번호만 연결한다. */
export function getFacilityPhoneLinks(phone: string) {
	const matches = phone.replace(/-\s+(?=\d)/g, '-').match(/(?<![\d-])0(?:50\d|\d{1,2})-\d{3,4}-\d{4}(?!\d)/g) ?? [];
	return [...new Set(matches)].map((label) => ({ label, href: `tel:${label.replaceAll('-', '')}` }));
}

export function getFacilityOfficialUrl(url: string) {
	try {
		const parsed = new URL(url);
		return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null;
	} catch {
		return null;
	}
}
