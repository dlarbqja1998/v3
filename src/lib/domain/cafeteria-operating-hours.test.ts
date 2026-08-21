import { describe, expect, it } from 'vitest';

import {
	canEditCafeteriaOperatingHours,
	getCafeteriaOperatingStatus,
	validateOperatingHoursInput,
	type CafeteriaOperatingHour
} from './cafeteria-operating-hours';

const weekdayBreakfast: CafeteriaOperatingHour = {
	id: 'jinri-breakfast',
	cafeteriaCode: 'jinri',
	label: '조식',
	daysOfWeek: [1, 2, 3, 4, 5],
	opensAt: '07:30',
	closesAt: '09:30',
	displayOrder: 1
};

describe('학식 운영시간', () => {
	it('평일 식사 시간에는 영업중을 계산한다', () => {
		expect(
			getCafeteriaOperatingStatus([weekdayBreakfast], new Date('2026-08-24T08:00:00+09:00'))
		).toEqual({ kind: 'open', label: '영업중' });
	});

	it('운영하지 않는 토요일에는 영업 종료를 계산한다', () => {
		expect(
			getCafeteriaOperatingStatus([weekdayBreakfast], new Date('2026-08-22T08:00:00+09:00'))
		).toEqual({ kind: 'closed', label: '영업 종료' });
	});

	it('운영시간 행이 없을 때 미등록 상태를 계산한다', () => {
		expect(getCafeteriaOperatingStatus([], new Date('2026-08-24T08:00:00+09:00'))).toEqual({
			kind: 'unregistered',
			label: '운영시간 미등록'
		});
	});

	it('종료 시간이 시작 시간보다 이른 입력을 거부한다', () => {
		expect(
			validateOperatingHoursInput({
				cafeteriaCode: 'jinri',
				rows: [{ label: '중식', daysOfWeek: [1, 2, 3, 4, 5], opensAt: '13:00', closesAt: '11:30' }]
			})
		).toEqual({ ok: false, message: '종료 시간은 시작 시간보다 늦어야 합니다.' });
	});

	it('ID 1 관리자에게만 수정 권한을 준다', () => {
		expect(canEditCafeteriaOperatingHours({ id: 1, role: 'admin' })).toBe(true);
		expect(canEditCafeteriaOperatingHours({ id: 2, role: 'admin' })).toBe(false);
		expect(canEditCafeteriaOperatingHours({ id: 1, role: 'student' })).toBe(false);
	});
});
