import { describe, expect, it } from 'vitest';
import type { Place } from '$lib/domain/places';
import { clusterOutsidePlaces } from './outside-markers';

const place = (id: string, longitude: number, latitude = 36.6): Place => ({
	id, longitude, latitude, name: id, type: 'restaurant', categorySlug: 'restaurant', categoryName: '음식점',
	zoneId: 'front-gate', scope: 'outside', locationGuide: null, operatingHours: null,
	phone: null, description: '', icon: 'food', isVisible: true, displayPriority: 0
});

describe('교외 가게 묶음', () => {
	it('겹치는 가게만 묶고 확대하면 각각 표시한다', () => {
		const places = [place('a', 127.3), place('b', 127.3005), place('c', 127.31)];
		expect(clusterOutsidePlaces(places, 16).map(group => group.places.length)).toEqual([2, 1]);
		expect(clusterOutsidePlaces(places, 19)).toHaveLength(3);
	});
	it('정렬 순서가 바뀌어도 묶음이 유지되고 가게가 중복되거나 빠지지 않는다', () => {
		const places = [place('c', 127.31), place('b', 127.3005), place('a', 127.3)];
		const groups = clusterOutsidePlaces(places, 16);
		expect(groups).toEqual(clusterOutsidePlaces([...places].reverse(), 16));
		expect(groups.flatMap(group => group.places.map(item => item.id)).sort()).toEqual(['a', 'b', 'c']);
	});
	it('유효하지 않은 좌표는 다른 가게의 위치 계산에 영향을 주지 않는다', () => {
		expect(clusterOutsidePlaces([place('bad', NaN), place('good', 127.3)], 16).map(group => group.id)).toEqual(['good']);
	});
});
