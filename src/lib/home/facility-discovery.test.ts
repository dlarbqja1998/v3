import { describe, expect, it } from 'vitest';
import type { Place } from '$lib/domain/places';
import {
	getFacilitySearchPlaceholder,
	getNextActivePlaceId,
	getVisibleFacilityPlaces
} from './facility-discovery';

function facility(overrides: Partial<Place> & Pick<Place, 'id' | 'name'>): Place {
	return {
		type: 'facility',
		categorySlug: 'cafe',
		categoryName: '카페',
		zoneId: null,
		scope: 'campus',
		latitude: 36.61,
		longitude: 127.28,
		locationGuide: '학생회관 1층',
		operatingHours: null,
		phone: null,
		description: '',
		icon: 'cafe',
		isVisible: true,
		displayPriority: 1,
		...overrides
	};
}

describe('시설 탐색 상태', () => {
	it('범위와 카테고리로 시설을 걸러 관리자 순서로 정렬한다', () => {
		const places = [
			facility({ id: 'priority-2', name: '두 번째 카페', displayPriority: 2 }),
			facility({ id: 'outside', name: '교외 카페', scope: 'outside', zoneId: 'front-gate' }),
			facility({ id: 'priority-1', name: '첫 번째 카페', displayPriority: 1 }),
			facility({ id: 'gym', name: '헬스장', categorySlug: 'gym', categoryName: '헬스장' })
		];

		expect(
			getVisibleFacilityPlaces(places, {
				scope: 'campus',
				zoneId: 'all',
				categorySlug: 'cafe',
				query: ''
			}).map((place) => place.id)
		).toEqual(['priority-1', 'priority-2']);
	});

	it('시설명과 카테고리명으로 검색하고 학식은 제외한다', () => {
		const cafe = facility({ id: 'cafe', name: '중앙광장 카페' });
		const convenience = facility({
			id: 'gs',
			name: '학생회관 GS25',
			categorySlug: 'convenience-store',
			categoryName: '편의점',
			icon: 'convenience_store_GS'
		});
		const cafeteria = facility({ id: 'meal', name: '진리관 식당', type: 'cafeteria' });

		expect(
			getVisibleFacilityPlaces([cafe, convenience, cafeteria], {
				scope: 'campus', zoneId: 'all', categorySlug: 'all', query: '편의점'
			}).map((place) => place.id)
		).toEqual(['gs']);
	});

	it('요청한 활성 핀이 없으면 첫 시설을 선택한다', () => {
		const places = [facility({ id: 'first', name: '첫 시설' }), facility({ id: 'second', name: '둘째 시설' })];
		expect(getNextActivePlaceId(places, 'missing')).toBe('first');
		expect(getNextActivePlaceId([], 'missing')).toBe('');
	});

	it('지도 범위에 맞는 검색 안내 문구를 반환한다', () => {
		expect(getFacilitySearchPlaceholder('campus', '캠퍼스')).toBe('교내 시설을 검색해 보세요');
		expect(getFacilitySearchPlaceholder('outside', '고대앞')).toBe('고대앞 시설을 검색해 보세요');
	});
});
