import { describe, expect, it } from 'vitest';
import { canManageCampusBoundaries } from './my-page';

describe('canManageCampusBoundaries', () => {
	it('관리자에게만 캠퍼스 핀 수정 메뉴를 허용한다', () => {
		expect(canManageCampusBoundaries('admin')).toBe(true);
		expect(canManageCampusBoundaries('user')).toBe(false);
	});
});
