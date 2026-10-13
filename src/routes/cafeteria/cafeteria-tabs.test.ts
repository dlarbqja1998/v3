import { describe, expect, it } from 'vitest';
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
		student: { breakfast: ['쌀밥'], korean: [], special: [], snack: [], dinner: [] },
		faculty: { lunch: ['교직원 중식'], dinner: [] }
	}))
};

describe('학식 식당 탭', () => {
	it('버튼 전역 리셋이 선택 탭의 글꼴 굵기를 덮어쓰지 않는다', () => {
		const appCss = readFileSync(new URL('../../app.css', import.meta.url), 'utf8');

		expect(appCss).toContain('font-family: inherit;');
		expect(appCss).not.toMatch(/button,\s*input,\s*select\s*\{\s*font:\s*inherit;/);
	});

	it('전체 식당 이름과 각 이름 너비의 밑줄로 선택 상태를 표시한다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [
						{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu },
						{ id: 'faculty', name: '교직원 식당', source: 'crawler', weeklyMenu }
					],
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toContain('data-cafeteria-tabs');
		expect(body).toMatch(/<button[^>]*text-\[14px\][^>]*font-semibold[^>]*aria-pressed="true">[\s\S]*?진리관 학생 식당[\s\S]*?<\/button>/);
		expect(body).toMatch(/<button[^>]*font-medium[^>]*aria-pressed="false">[\s\S]*?미래관 교직원 식당[\s\S]*?<\/button>/);
		expect(body).not.toContain('푸드코트');
		expect(body.match(/data-cafeteria-tab-indicator/g)).toHaveLength(2);
		expect(body).not.toContain('translateX(');
	});

	it('교직원 식당 링크로 진입하면 교직원 탭을 초기 선택한다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [
						{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu },
						{ id: 'faculty', name: '교직원 식당', source: 'crawler', weeklyMenu }
					],
					initialCafeteriaId: 'faculty',
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toMatch(/<button[^>]*font-medium[^>]*aria-pressed="false">[\s\S]*?진리관 학생 식당[\s\S]*?<\/button>/);
		expect(body).toMatch(/<button[^>]*font-semibold[^>]*aria-pressed="true">[\s\S]*?미래관 교직원 식당[\s\S]*?<\/button>/);
		expect(body).toContain('미래관 교직원 식당의 중식 메뉴를 확인할 수 있어요.');
	});

	it('교직원 식당은 중식만 표시하고 석식은 표시하지 않는다', () => {
		const facultyMenu = {
			...weeklyMenu,
			days: weeklyMenu.days.map((day, index) =>
				index === 0
					? { ...day, faculty: { lunch: ['교직원 중식'], dinner: ['교직원 석식'] } }
					: day
			)
		};
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [{ id: 'faculty', name: '교직원 식당', source: 'crawler', weeklyMenu: facultyMenu }],
					initialCafeteriaId: 'faculty',
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toContain('중식 메뉴 펼치기');
		expect(body).not.toContain('석식 메뉴 펼치기');
		expect(body).not.toContain('교직원 석식');
	});

	it('로그인 후 돌아오면 선택했던 요일을 초기 선택한다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu }],
					initialCafeteriaId: 'jinri',
					initialDayKey: 'wed',
					cafeteriaFeedback: {},
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toContain('data-cafeteria-day-key="wed"');
		expect(body).toMatch(/<p[^>]*sr-only[^>]*data-cafeteria-date[^>]*>8\.26 \(수\)<\/p>/);
		expect(body).toMatch(/<button[^>]*selected[^>]*aria-pressed="true"[^>]*data-cafeteria-day-key="wed"/);
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

		expect(body).toMatch(/<button class="[^"]*outline-none[^"]*focus-visible:ring-2[^"]*"[^>]*aria-pressed="true">[\s\S]*?진리관 학생 식당/);
	});

	it('요일 선택 상태를 알리고 숫자 날짜는 선택 버튼의 접근성 이름으로 제공한다', () => {
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
		expect(body).toMatch(/<button[^>]*selected[^>]*aria-pressed="true"[^>]*aria-label="8\.24 \(월\) 식단"/);
		expect(body).not.toContain('data-cafeteria-day-number');
	});

	it('진리관의 일품 구획을 학교 식단 명칭 그대로 표시한다', () => {
		const menuWithSpecial = {
			...weeklyMenu,
			days: weeklyMenu.days.map((day, index) =>
				index === 0
					? { ...day, student: { ...day.student, special: ['불고기'] } }
					: day
			)
		};
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu: menuWithSpecial }],
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toContain('일품 메뉴 펼치기');
		expect(body).not.toContain('특식 메뉴 펼치기');
	});

	it('날짜는 보조 안내로 남기고 식사 행의 펼침 상태를 안내한다', () => {
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

		expect(body).toMatch(/<p[^>]*sr-only[^>]*data-cafeteria-date[^>]*>8\.24 \(월\)<\/p>/);
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

		expect(body).toContain('cafeteria-meal-chevron');
		expect(body).not.toContain('lucide-plus');
	});

	it('식당 설명 다음에 지도와 운영시간 동작을 제공한다', () => {
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
			expect(body).toContain('whitespace-nowrap');
			expect(body).toContain('aria-haspopup="dialog"');
			expect(body).toContain('aria-controls="cafeteria-operating-hours"');
			expect(body.indexOf('data-cafeteria-introduction')).toBeLessThan(body.indexOf('data-cafeteria-utility-row'));
			expect(body).toContain('지도에서 보기');
			expect(body).toContain('운영시간');
		}
		expect(crawlerBody.indexOf('data-cafeteria-actions')).toBeLessThan(crawlerBody.indexOf('data-cafeteria-day-tabs'));
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
		expect(body).toMatch(/<h1[^>]*>학식<\/h1>/);
		expect(body).toContain('sticky top-0 z-20');
	});

	it('상시 매장은 메인의 식당 필터로 이어준다', () => {
		const { body } = render(CafeteriaPage, {
			props: {
				data: {
					cafeterias: [{ id: 'foodcourt', name: '푸드코트', source: 'static', staticVendors: [] }],
					canEditOperatingHours: false,
					user: null
				},
				form: null
			} as never
		});

		expect(body).toContain('다른 교내 식당 찾기');
		expect(body).toContain('href="/?panel=facility&amp;category=restaurant"');
	});

	it('선택한 날의 메뉴가 모두 비어 있으면 빈 식사 목록 대신 안내를 표시한다', () => {
		const emptyMenu = {
			...weeklyMenu,
			days: weeklyMenu.days.map((day) => ({ ...day, student: { breakfast: [], korean: [], special: [], snack: [], dinner: [] } }))
		};
		const { body } = render(CafeteriaPage, {
			props: { data: { cafeterias: [{ id: 'jinri', name: '진리관', source: 'crawler', weeklyMenu: emptyMenu }], canEditOperatingHours: false, user: null }, form: null } as never
		});
		expect(body).toContain('오늘은 학식 운영 정보가 없어요');
		expect(body).toContain('data-cafeteria-day-tabs');
		expect(body).not.toContain('data-cafeteria-meal-list');
		expect(body).not.toContain('다른 교내 식당 찾기');
	});
});
