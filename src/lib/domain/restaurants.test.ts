import { describe, expect, it } from 'vitest';
import {
	EMPTY_OUTSIDE_VIEW, filterRestaurants, isOutsidePreview, koreanDate,
	membershipIsActive, restaurantTodayHours,
	type KuMembership, type RestaurantSummary
} from './restaurants';
import { normalizeRestaurantHours, restaurantWeekdays, type RestaurantWeekday, type SourceDayHours } from './restaurant-catalog';

const membership: KuMembership = {
	id: 'ku-test', placeId: 'cafe', periodLabel: '2026학년도 2학기', sourceName: '엔젤커피',
	summary: '포장 아메리카노 50% 할인', benefits: ['포장 아메리카노 50% 할인'],
	conditions: ['학생증 제시'], sourceUrl: 'https://example.com', sourceLabel: '총학생회',
	checkedOn: '2026-09-16', status: 'active', validFrom: null, validThrough: null
};
const restaurant = (id: string, name: string, category = 'restaurant', zone = 'front-gate'): RestaurantSummary => ({
	place: { id, name, categorySlug: category, type: category === 'cafe' ? 'cafe' : 'restaurant',
		categoryName: '음식점', zoneId: zone, scope: 'outside', latitude: 36.6, longitude: 127.3,
		locationGuide: null, operatingHours: null, phone: null, description: '', icon: 'food', isVisible: true, displayPriority: 0 },
	zoneName: '고대앞', cuisine: 'korean', sourceCategory: '한식', roadAddress: '세종특별자치시 행복11길 3',
	todayHours: '영업시간 확인 중', membership: null
});
const rows = [
	restaurant('rice', '가정식'),
	{ ...restaurant('cafe', '엔제리너스커피 조치원점', 'cafe', 'ukil'), membership },
	{ ...restaurant('bar', '인쌩맥주 세종조치원점', 'bar', 'ukil'), membership: { ...membership, sourceName: '인생맥주' } },
	{ ...restaurant('expired', '제휴 종료 매장'), membership: { ...membership, validThrough: '2026-09-15' } }
];

describe('교외 음식점 탐색', () => {
	it('저장된 통합 분류에서도 치킨과 피자·버거를 원문 업종으로 구분한다', () => {
		const chicken = { ...restaurant('chicken', '치킨집'), cuisine: 'chicken-fastfood' as const, sourceCategory: '치킨,닭강정' };
		const pizza = { ...restaurant('pizza', '피자집'), cuisine: 'chicken-fastfood' as const, sourceCategory: '피자' };
		expect(filterRestaurants([chicken, pizza], { ...EMPTY_OUTSIDE_VIEW, category: 'restaurant', cuisine: 'chicken' }).map(row => row.place.id)).toEqual(['chicken']);
		expect(filterRestaurants([chicken, pizza], { ...EMPTY_OUTSIDE_VIEW, category: 'restaurant', cuisine: 'fastfood' }).map(row => row.place.id)).toEqual(['pizza']);
	});
	it('묶음 핀의 목록에도 기존 구역과 업종 조건이 적용된다', () => {
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, category: 'cafe', clusterPlaceIds: ['rice', 'cafe'] }).map(row => row.place.id)).toEqual(['cafe']);
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, clusterPlaceIds: [] })).toEqual([]);
	});
	it('구역·업종·KU멤버십 조건을 모두 적용한다', () => {
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, zone: 'ukil', category: 'cafe', membershipOnly: true }, '2026-09-16')
			.map(row => row.place.id)).toEqual(['cafe']);
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, zone: 'front-gate', membershipOnly: true }, '2026-09-16')).toEqual([]);
	});
	it('원문 별칭으로 찾아도 네이버 매장명은 유지한다', () => {
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, query: '엔젤 커피' })[0].place.name).toBe('엔제리너스커피 조치원점');
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, query: '인생맥주' })[0].place.name).toBe('인쌩맥주 세종조치원점');
	});
	it('주소로 검색하고 음식점에서만 음식 종류를 제한한다', () => {
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, query: '행복11길 3' })).toHaveLength(4);
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, category: 'restaurant', cuisine: 'japanese' })).toEqual([]);
		expect(filterRestaurants(rows, { ...EMPTY_OUTSIDE_VIEW, category: 'cafe', cuisine: 'japanese' })).toHaveLength(1);
	});
	it('유효한 제휴를 우선 표시하고 종료된 혜택은 제외한다', () => {
		expect(filterRestaurants(rows, EMPTY_OUTSIDE_VIEW, '2026-09-16').slice(0, 2).map(row => row.place.id)).toEqual(['cafe', 'bar']);
		expect(membershipIsActive({ ...membership, status: 'ended' }, '2026-09-16')).toBe(false);
		expect(membershipIsActive({ ...membership, validFrom: '2026-09-17' }, '2026-09-16')).toBe(false);
		expect(membershipIsActive({ ...membership, validThrough: '2026-09-16' }, '2026-09-16')).toBe(true);
		expect(membershipIsActive(null)).toBe(false);
	});
});

describe('한국 날짜와 영업 안내', () => {
	it('UTC 자정 대신 한국 자정에 날짜가 바뀐다', () => {
		expect(koreanDate(new Date('2026-09-15T15:00:00Z'))).toBe('2026-09-16');
	});
	it('자료가 없으면 미확인으로 표시하고 익일 마감과 휴무 예외를 구분한다', () => {
		const sourceDay = (): SourceDayHours => ({
			isClosed: false, open: '18:00', close: '02:00', breakTimes: [], lastOrder: null, note: null
		});
		const weekly = Object.fromEntries(restaurantWeekdays.map(day => [day, sourceDay()])) as Record<RestaurantWeekday, SourceDayHours>;
		const hours = normalizeRestaurantHours(weekly);
		hours.exceptions = [{ date: '2026-09-17', status: 'closed', reason: '임시 휴무' }];
		expect(restaurantTodayHours(null)).toBe('영업시간 확인 중');
		expect(restaurantTodayHours(hours, '2026-09-16')).toBe('오늘 18:00~다음 날 02:00');
		expect(restaurantTodayHours(hours, '2026-09-17')).toBe('오늘 휴무');
	});
});

describe('교외 미리보기 공개 범위', () => {
	it('개발 서버의 루프백 주소에서만 열고 배포 환경과 외부 주소에서는 닫는다', () => {
		for (const host of ['localhost', '127.0.0.1', '[::1]', '::1']) {
			expect(isOutsidePreview(true, host)).toBe(true);
			expect(isOutsidePreview(false, host)).toBe(false);
		}
		for (const host of ['golabau.com', 'localhost.example.com', '192.168.0.10']) {
			expect(isOutsidePreview(true, host)).toBe(false);
		}
	});
});
