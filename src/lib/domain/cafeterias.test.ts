import { describe, expect, it } from 'vitest';
import { staticFoodCourtVendors } from './cafeterias';

describe('푸드코트 정적 메뉴', () => {
	it('업체별 메뉴에 수정 가능한 식별자와 가격을 제공한다', () => {
		const menu = staticFoodCourtVendors[0]?.menus[0];

		expect(menu).toEqual(
			expect.objectContaining({ id: expect.any(String), name: expect.any(String), price: expect.any(Number) })
		);
	});
});
