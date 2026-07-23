import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import {
	cafeteriaMenuItems,
	cafeteriaMenuOfferings,
	cafeteriaMenuVotes
} from './schema';

describe('학식 평가 스키마', () => {
	it('반복 메뉴, 날짜별 제공 회차, 사용자 평가 테이블을 정의한다', () => {
		expect(getTableConfig(cafeteriaMenuItems).name).toBe('cafeteria_menu_items');
		expect(getTableConfig(cafeteriaMenuOfferings).name).toBe('cafeteria_menu_offerings');
		expect(getTableConfig(cafeteriaMenuVotes).name).toBe('cafeteria_menu_votes');
	});
});
