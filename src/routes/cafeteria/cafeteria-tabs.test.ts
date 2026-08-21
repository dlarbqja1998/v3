import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';

import CafeteriaPage from './+page.svelte';

const weeklyMenu = {
	todayKey: 'mon' as const,
	todayDate: '2026.08.24',
	todayDay: '월',
	weekStartDate: '2026.08.24',
	days: ['mon', 'tue', 'wed', 'thu', 'fri'].map((key, index) => ({
		key: key as 'mon' | 'tue' | 'wed' | 'thu' | 'fri',
		date: `2026.08.${24 + index}`,
		day: ['월', '화', '수', '목', '금'][index],
		student: { breakfast: [], korean: [], special: [], snack: [], dinner: [] },
		faculty: { lunch: [], dinner: [] }
	}))
};

describe('학식 식당 탭', () => {
	it('선택된 식당에 크림슨 글자와 이동 가능한 밑줄을 표시한다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [
						{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu },
						{ id: 'faculty', name: '교직원 식당', source: 'crawler', weeklyMenu },
						{ id: 'foodcourt', name: '푸드코트', source: 'static', staticVendors: [] }
					],
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toContain('data-cafeteria-tabs');
		expect(body).toContain('text-[15px]');
		expect(body).toContain('text-brand');
		expect(body).toContain('text-brand-muted');
		expect(body).toContain('text-brand-muted" type="button" aria-pressed="false">교직원');
		expect(body).toContain('data-cafeteria-tab-indicator');
		expect(body).toContain('transition-[transform,width] duration-300');
	});

	it('날짜 선택은 상단 탭과 구분되는 기존 pill UI를 유지한다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu }],
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toContain('data-cafeteria-day-tabs');
		expect(body).toContain('rounded-[15px] bg-brand-map p-1');
		expect(body).toContain('bg-brand text-white shadow-sm');
	});

	it('스크롤되어도 흰 배경의 헤더가 콘텐츠를 가린다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: { cafeterias: [], canEditOperatingHours: false, user: null },
				form: null
			} as never
		});

		expect(body).toContain('data-cafeteria-header');
		expect(body).toContain('sticky top-0 z-20 border-b border-brand-border bg-white');
	});
});
