import { describe, expect, it } from 'vitest';
import type { Place } from '$lib/domain/places';
import { filterPublicPlaces } from './public-places';

const places: Place[] = [
	{
		id: 'cafeteria',
		type: 'cafeteria',
		name: '진리관 식당',
		categorySlug: 'cafeteria',
		categoryName: '학식',
		zoneId: null,
		scope: 'campus',
		latitude: 36.61,
		longitude: 127.28,
		locationGuide: null,
		operatingHours: null,
		phone: null,
		description: '',
		icon: 'food',
		isVisible: true,
		displayPriority: 0
	},
	{
		id: 'campus-gym',
		type: 'facility',
		name: '교내 헬스장',
		categorySlug: 'gym',
		categoryName: '헬스장',
		zoneId: null,
		scope: 'campus',
		latitude: 36.61,
		longitude: 127.28,
		locationGuide: '체육관 1층',
		operatingHours: null,
		phone: null,
		description: '',
		icon: 'gym',
		isVisible: true,
		displayPriority: 1
	},
	{
		id: 'outside-gym',
		type: 'facility',
		name: '고대앞 헬스장',
		categorySlug: 'gym',
		categoryName: '헬스장',
		zoneId: 'front-gate',
		scope: 'outside',
		latitude: 36.6,
		longitude: 127.29,
		locationGuide: '고대앞',
		operatingHours: null,
		phone: null,
		description: '',
		icon: 'gym',
		isVisible: true,
		displayPriority: 1
	},
	{
		id: 'hidden',
		type: 'facility',
		name: '숨김 헬스장',
		categorySlug: 'gym',
		categoryName: '헬스장',
		zoneId: null,
		scope: 'campus',
		latitude: 36.61,
		longitude: 127.28,
		locationGuide: '숨김',
		operatingHours: null,
		phone: null,
		description: '',
		icon: 'gym',
		isVisible: false,
		displayPriority: 2
	}
];

describe('공개 시설 핀 필터', () => {
	it('시설 전용 옵션이 없으면 기존 공개 장소 API 계약을 유지한다', () => {
		expect(filterPublicPlaces(places, {}).map((place) => place.id)).toContain('cafeteria');
	});

	it('교내 공개 시설만 반환한다', () => {
		expect(filterPublicPlaces(places, { scope: 'campus', category: 'gym', facilityOnly: true }).map((place) => place.id)).toEqual(['campus-gym']);
	});

	it('교외 상권과 검색어를 함께 적용한다', () => {
		expect(filterPublicPlaces(places, { scope: 'outside', zone: 'front-gate', query: '고대앞', facilityOnly: true }).map((place) => place.id)).toEqual(['outside-gym']);
	});
});
