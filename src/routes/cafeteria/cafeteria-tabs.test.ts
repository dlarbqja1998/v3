import { describe, expect, it } from 'vitest';
// @ts-expect-error 프로젝트 tsconfig는 Node 타입을 전역으로 포함하지 않는다.
import { readFileSync } from 'node:fs';
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
	it('버튼 전역 리셋이 선택 탭의 글꼴 굵기를 덮어쓰지 않는다', () => {
		const appCss = readFileSync(new URL('../../app.css', import.meta.url), 'utf8');

		expect(appCss).toContain('font-family: inherit;');
		expect(appCss).not.toMatch(/button,\s*input,\s*select\s*\{\s*font:\s*inherit;/);
	});

	it('선택된 식당에 굵은 크림슨 글자와 이동 가능한 밑줄을 표시한다', () => {
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
		expect(body).toContain('font-black text-brand" type="button" aria-pressed="true">진리관');
		expect(body).toContain('text-brand');
		expect(body).toContain('text-brand-muted');
		expect(body).toContain('font-bold text-brand-muted" type="button" aria-pressed="false">교직원');
		expect(body).toContain('data-cafeteria-tab-indicator');
		expect(body).toContain('transition-[transform,width] duration-300');
	});

	it('식당 탭은 마우스 선택 때 기본 검은 윤곽선 대신 키보드 포커스 표시만 사용한다', () => {
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

		expect(body).toMatch(/<button class="[^"]*outline-none[^"]*focus-visible:ring-2[^"]*"[^>]*aria-pressed="true">진리관/);
	});

	it('날짜 없이 선택한 요일을 작은 글자에 맞는 원의 중앙에 강조한다', () => {
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
		expect(body).toContain('data-cafeteria-day-label');
		expect(body).toContain('h-9 w-9 place-items-center rounded-full text-s leading-none pt-px');
		expect(body).toContain('bg-brand text-white shadow-sm" data-cafeteria-day-label');
		expect(body).not.toContain('data-cafeteria-day-number');
	});

	it('날짜를 식사명보다 높은 문서 위계로 제공하고, 식사 행의 펼침 상태를 안내한다', () => {
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

		expect(body).toMatch(/<h2[^>]*data-cafeteria-date[^>]*>8\.24 \(월\)<\/h2>/);
		expect(body).toMatch(/<h3[^>]*data-cafeteria-meal-title[^>]*>조식<\/h3>/);
		expect(body).toContain('data-cafeteria-list-pin');
		expect(body).toContain('aria-label="조식 메뉴 펼치기"');
		expect(body).toContain('aria-expanded="false"');
	});

	it('접힌 식사 메뉴에는 더하기 기호 대신 아래 방향 꺾쇠를 표시한다', () => {
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

		expect(body).toContain('lucide-chevron-down');
		expect(body).not.toContain('lucide-plus');
	});

	it('식당별 메뉴 정보 행에서 지도와 운영시간 동작을 제공한다', () => {
		const crawlerBody = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu }],
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		}).body;
		const staticBody = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [{ id: 'foodcourt', name: '푸드코트', source: 'static', staticVendors: [] }],
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		}).body;

		for (const body of [crawlerBody, staticBody]) {
			expect(body).toContain('data-cafeteria-utility-row');
			expect(body).toContain('data-cafeteria-actions');
			expect(body).toContain('data-cafeteria-map-action');
			expect(body).toContain('text-[13px] font-bold text-brand');
			expect(body).toContain('whitespace-nowrap');
			expect(body).toContain('lucide-chevron-right');
			expect(body.match(/width="13" height="13"/g)).toHaveLength(2);
			expect(body).toContain('지도에서 보기');
			expect(body).toContain('운영시간');
		}
		expect(crawlerBody).toContain('items-center justify-between border-b border-brand-border');
		expect(staticBody).toContain('items-center justify-end border-b border-brand-border');
		expect(crawlerBody).not.toContain('주간 식단');
		expect(staticBody).not.toContain('상시 메뉴');
		expect(crawlerBody).not.toContain('메뉴를 눌러 펼쳐보세요');
	});

	it('스크롤되어도 흰 배경의 헤더가 콘텐츠를 가린다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: { cafeterias: [], canEditOperatingHours: false, user: null },
				form: null
			} as never
		});

		expect(body).toContain('data-lifestyle-page-header');
		expect(body).toContain('오늘, 학식');
		expect(body).toContain('sticky top-0 z-20');
	});
});
