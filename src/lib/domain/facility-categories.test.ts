import { describe, expect, it } from 'vitest';
import { FACILITY_CATEGORIES, isFacilityCategorySlug } from './facility-categories';

describe('시설 핀 고정 카테고리', () => {
	it('승인된 여섯 시설 카테고리를 아이콘 파일명과 연결한다', () => {
		expect(FACILITY_CATEGORIES.map(({ slug, icon }) => [slug, icon])).toEqual([
			['convenience-store', 'convenience_store_GS'],
			['cafe', 'cafe'],
			['copy-room', 'print'],
			['crimson-store', 'crimson_store'],
			['gym', 'gym'],
			['post-office', 'post_office']
		]);
	});

	it('화면 조작용 아이콘은 시설 카테고리로 허용하지 않는다', () => {
		expect(isFacilityCategorySlug('gym')).toBe(true);
		expect(isFacilityCategorySlug('home')).toBe(false);
	});
});
