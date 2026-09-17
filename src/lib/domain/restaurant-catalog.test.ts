import { describe, expect, it } from 'vitest';
import {
	classifyRestaurant,
	isInsideRestaurantZone,
	normalizeRestaurantDay,
	normalizeRestaurantHours,
	normalizeRestaurantMenus,
	resolveRestaurantDay,
	restaurantWeekdays,
	type RestaurantWeekday,
	type SourceDayHours,
	type SourceRestaurantMenu
} from './restaurant-catalog';

const day = (overrides: Partial<SourceDayHours> = {}): SourceDayHours => ({
	isClosed: false, open: '10:00', close: '21:00', breakTimes: [],
	lastOrder: null, note: null, ...overrides
});
const week = () => Object.fromEntries(restaurantWeekdays.map(d => [d, day()])) as Record<RestaurantWeekday, SourceDayHours>;
const menu = (overrides: Partial<SourceRestaurantMenu> = {}): SourceRestaurantMenu => ({
	name: '닭갈비', category: null, price: 10000, priceText: '10,000원',
	description: '', options: [], status: 'available', ...overrides
});

describe('음식점 영업시간 정리', () => {
	it('시간이 없는 요일을 영업 중이나 휴무로 확정하지 않는다', () => {
		expect(normalizeRestaurantDay(day({ open: null, close: null })).status).toBe('unknown');
		expect(normalizeRestaurantDay(day({ isClosed: true, open: null, close: null })).status).toBe('closed');
	});

	it('격주 휴무 표시를 매주 휴무로 바꾸지 않는다', () => {
		expect(normalizeRestaurantDay(day({ isClosed: true, open: null, close: null, note: '격주 수요일 정기 휴무' })).status).toBe('unknown');
	});

	it('점심과 저녁 주문 마감을 모두 보존하고 자정 이후 영업을 구분한다', () => {
		expect(normalizeRestaurantDay(day({ lastOrder: '14:30 , 20:30, 14:30 ' })).lastOrders).toEqual(['14:30', '20:30']);
		expect(normalizeRestaurantDay(day({ open: '18:00', close: '02:00' })).closesNextDay).toBe(true);
		expect(normalizeRestaurantDay(day({ close: '24:00' })).closesNextDay).toBe(true);
	});

	it('두 번째와 네 번째 목요일만 휴무로 판단한다', () => {
		const hours = normalizeRestaurantHours(week(), ['매달 2, 4번째 목요일 정기 휴무']);
		expect(resolveRestaurantDay(hours, '2026-09-10').status).toBe('closed');
		expect(resolveRestaurantDay(hours, '2026-09-17').status).toBe('scheduled');
		expect(resolveRestaurantDay(hours, '2026-09-24').status).toBe('closed');
	});

	it('마지막 월요일과 다섯 번째 일요일의 휴무를 구분한다', () => {
		const hours = normalizeRestaurantHours(week(), ['매월 마지막주 월요일 휴무', '매달 2, 4, 5번째 일요일 정기 휴무']);
		expect(resolveRestaurantDay(hours, '2026-09-21').status).toBe('scheduled');
		expect(resolveRestaurantDay(hours, '2026-09-28').status).toBe('closed');
		expect(resolveRestaurantDay(hours, '2026-08-30').status).toBe('closed');
		expect(resolveRestaurantDay(hours, '2026-09-20').status).toBe('scheduled');
	});

	it('격주 기준일을 모르면 해당 요일만 미확인으로 처리한다', () => {
		const hours = normalizeRestaurantHours(week(), ['격주 수요일 정기 휴무']);
		expect(resolveRestaurantDay(hours, '2026-09-16').status).toBe('unknown');
		expect(resolveRestaurantDay(hours, '2026-09-17').status).toBe('scheduled');
		hours.holidayRules[0].anchorDate = '2026-09-16';
		expect(resolveRestaurantDay(hours, '2026-09-16').status).toBe('closed');
		expect(resolveRestaurantDay(hours, '2026-09-23').status).toBe('scheduled');
		expect(resolveRestaurantDay(hours, '2026-09-30').status).toBe('closed');
	});

	it('날짜가 붙은 시간표를 유효 기간 밖으로 반복하지 않는다', () => {
		const hours = normalizeRestaurantHours(week());
		hours.validFrom = '2026-09-16';
		hours.validThrough = '2026-09-22';
		expect(resolveRestaurantDay(hours, '2026-09-15').status).toBe('unknown');
		expect(resolveRestaurantDay(hours, '2026-09-16').status).toBe('scheduled');
		expect(resolveRestaurantDay(hours, '2026-09-22').status).toBe('scheduled');
		expect(resolveRestaurantDay(hours, '2026-09-23').status).toBe('unknown');
	});

	it('명절의 특정일 휴무를 우선하고 잘못된 날짜는 미확인으로 처리한다', () => {
		const hours = normalizeRestaurantHours(week());
		hours.exceptions = [{ date: '2026-09-25', status: 'closed', reason: '추석 휴무' }];
		expect(resolveRestaurantDay(hours, '2026-09-25')).toMatchObject({ status: 'closed', note: '추석 휴무' });
		expect(resolveRestaurantDay(hours, '2026-09-26').status).toBe('scheduled');
		expect(resolveRestaurantDay(hours, '2026-02-30').status).toBe('unknown');
	});

	it('날짜가 지정된 단축 영업은 그날만 적용하고 다음 주에 반복하지 않는다', () => {
		const hours = normalizeRestaurantHours(week());
		hours.exceptions = [{ ...normalizeRestaurantDay(day({open:'11:00',close:'14:30'})),
			status:'scheduled',date:'2026-09-23',reason:'추석 연휴 전 단축 영업' }];
		expect(resolveRestaurantDay(hours,'2026-09-23')).toMatchObject({status:'scheduled',open:'11:00',close:'14:30'});
		expect(resolveRestaurantDay(hours,'2026-09-30')).toEqual(hours.weekly.wednesday);
	});
});

describe('음식점 메뉴 정리', () => {
	it('중복 메뉴를 묶어도 설명과 원본 행을 모두 보존한다', () => {
		const result = normalizeRestaurantMenus([menu({ description: '국내산 닭' }), menu({ name: '닭 갈비', description: '2인 이상 주문' })]);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ price: 10000, priceStatus: 'priced', sourceIndexes: [0, 1], descriptions: ['국내산 닭', '2인 이상 주문'] });
	});

	it('같은 이름에 가격이 다르면 임의로 싼 가격을 선택하지 않는다', () => {
		const result = normalizeRestaurantMenus([menu(), menu({ price: 12000, priceText: '12,000원' })]);
		expect(result[0]).toMatchObject({ price: null, priceText: '가격 확인 필요', priceStatus: 'conflict', sourceIndexes: [0, 1] });
		expect(result[0].priceCandidates.map(p => p.price)).toEqual([10000, 12000]);
	});

	it('동일 이름이어도 옵션이나 분류가 다르면 별도 메뉴로 남긴다', () => {
		const result = normalizeRestaurantMenus([menu(), menu({ options: ['곱빼기'] }), menu({ category: '배달' })]);
		expect(result).toHaveLength(3);
	});

	it('같은 메뉴의 방문 가격과 배달 가격은 충돌시키지 않고 출처를 유지한다', () => {
		const result=normalizeRestaurantMenus([menu({channel:'store'}),menu({channel:'delivery',price:12000,priceText:'12,000원'})]);
		expect(result.map(item=>({price:item.price,channel:item.channel}))).toEqual([
			{price:10000,channel:'store'},{price:12000,channel:'delivery'}
		]);
	});
});

describe('구역과 골라바유 분류 연결', () => {
	it('다각형 내부와 경계에 놓인 좌표를 포함하고 바깥 좌표를 제외한다', () => {
		const boundary = [
			{ latitude: 36, longitude: 127 }, { latitude: 36, longitude: 128 },
			{ latitude: 37, longitude: 128 }, { latitude: 37, longitude: 127 }
		];
		expect(isInsideRestaurantZone(36.5, 127.5, boundary)).toBe(true);
		expect(isInsideRestaurantZone(36, 127.5, boundary)).toBe(true);
		expect(isInsideRestaurantZone(36, 127, boundary)).toBe(true);
		expect(isInsideRestaurantZone(35.9, 127.5, boundary)).toBe(false);
		expect(isInsideRestaurantZone(36.5, 127.5, boundary.slice(0, 2))).toBe(false);
	});

	it('카페·술집과 음식점의 세부 분류를 분리한다', () => {
		expect(classifyRestaurant('베이커리', '음식점>카페,디저트')).toEqual({ category: 'cafe', cuisine: 'other' });
		expect(classifyRestaurant('이자카야')).toEqual({ category: 'bar', cuisine: 'other' });
		expect(classifyRestaurant('돈가스', '음식점>일식')).toEqual({ category: 'restaurant', cuisine: 'japanese' });
		expect(classifyRestaurant('칼국수,만두')).toEqual({ category: 'restaurant', cuisine: 'korean' });
		expect(classifyRestaurant('향토음식')).toEqual({ category: 'restaurant', cuisine: 'korean' });
		expect(classifyRestaurant('치킨,닭강정')).toEqual({ category: 'restaurant', cuisine: 'chicken' });
		expect(classifyRestaurant('피자')).toEqual({ category: 'restaurant', cuisine: 'fastfood' });
		expect(classifyRestaurant('종합분식')).toEqual({ category: 'restaurant', cuisine: 'snack' });
		expect(classifyRestaurant('베트남음식')).toEqual({ category: 'restaurant', cuisine: 'asian' });
		expect(classifyRestaurant('마라탕')).toEqual({ category: 'restaurant', cuisine: 'chinese' });
	});
});
