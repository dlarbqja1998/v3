import { describe, expect, it } from 'vitest';
import {
	cafeteriaPlaces,
	getCafeteriaMapHref,
	getCafeteriaPageHref,
	getInitialCafeteriaIndex
} from './cafeterias';

describe('주간 학식당 지도 장소', () => {
	it('진리관과 교직원 좌표를 유지하면서 식당 카테고리로 제공한다', () => {
		expect(cafeteriaPlaces).toHaveLength(2);
		expect(cafeteriaPlaces.map((place) => place.id)).toEqual([
			'cafeteria-jinri',
			'cafeteria-faculty'
		]);
		for (const place of cafeteriaPlaces) {
			expect(place).toEqual(
				expect.objectContaining({
					type: 'cafeteria',
					categorySlug: 'restaurant',
					categoryName: '식당',
					icon: 'food'
				})
			);
		}
	});

	it('진리관과 교직원만 해당 식당이 선택되는 학식 페이지 링크를 제공한다', () => {
		expect(getCafeteriaPageHref(cafeteriaPlaces[0])).toBe('/cafeteria?cafeteria=jinri');
		expect(getCafeteriaPageHref(cafeteriaPlaces[1])).toBe('/cafeteria?cafeteria=faculty');
		expect(
			getCafeteriaPageHref({
				...cafeteriaPlaces[0],
				id: 'restaurant-bbq',
				type: 'facility'
			})
		).toBeNull();
	});

	it('지도에서 보기는 식당 필터의 해당 학식당으로 연결한다', () => {
		expect(getCafeteriaMapHref(cafeteriaPlaces[0])).toBe(
			'/?panel=facility&category=restaurant&place=cafeteria-jinri'
		);
		expect(getCafeteriaMapHref(cafeteriaPlaces[1])).toBe(
			'/?panel=facility&category=restaurant&place=cafeteria-faculty'
		);
	});

	it('요청한 학식당을 초기 선택하고 알 수 없는 값은 첫 식당으로 돌린다', () => {
		const cafeterias = [{ id: 'jinri' }, { id: 'faculty' }];

		expect(getInitialCafeteriaIndex(cafeterias, 'faculty')).toBe(1);
		expect(getInitialCafeteriaIndex(cafeterias, 'unknown')).toBe(0);
		expect(getInitialCafeteriaIndex([], 'faculty')).toBe(0);
	});
});
