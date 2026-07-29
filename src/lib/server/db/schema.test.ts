import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import {
	cafeteriaMenuItems,
	cafeteriaMenuOfferings,
	cafeteriaMenuVotes,
	users
} from './schema';

describe('학식 평가 스키마', () => {
	it('반복 메뉴, 날짜별 제공 회차, 사용자 평가 테이블을 정의한다', () => {
		expect(getTableConfig(cafeteriaMenuItems).name).toBe('cafeteria_menu_items');
		expect(getTableConfig(cafeteriaMenuOfferings).name).toBe('cafeteria_menu_offerings');
		expect(getTableConfig(cafeteriaMenuVotes).name).toBe('cafeteria_menu_votes');
	});
});

describe('사용자 인증 스키마', () => {
	it('카카오 로그인과 하이브리드 온보딩에 필요한 사용자 테이블을 정의한다', () => {
		expect(getTableConfig(users).name).toBe('users');
		expect(getTableConfig(users).columns.map((column) => column.name)).toEqual(
			expect.arrayContaining([
				'id',
				'email',
				'nickname',
				'provider',
				'provider_id',
				'college',
				'department',
				'grade',
				'gender',
				'is_onboarded',
				'role'
			])
		);
	});
});
