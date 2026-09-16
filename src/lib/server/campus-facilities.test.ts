import { describe, expect, it } from 'vitest';
import { readCampusFacilities } from './campus-facilities';
import { cafeteriaPlaces } from '$lib/domain/cafeterias';

describe('공개 교내 시설 자료', () => {
	it('등록된 핀이 없어도 학생지원 시설과 공식 안내를 제공한다', () => {
		const facilities = readCampusFacilities();
		expect(facilities).toHaveLength(28);
		expect(facilities.some((facility) => facility.id === 'FAC-028')).toBe(false);
		expect(facilities.find((facility) => facility.id === 'FAC-015')?.actions).toEqual(
			expect.arrayContaining([expect.objectContaining({ url: 'https://libs.korea.ac.kr/' })])
		);
		expect(facilities.find((facility) => facility.id === 'FAC-046')?.phone).toBe('044-860-1038');
	});
	it('현재 공개 중인 핀만 통합하고 숨겨진 핀은 다시 노출하지 않는다', () => {
		const [visible, hidden] = cafeteriaPlaces;
		const facilities = readCampusFacilities([visible, { ...hidden, isVisible: false }]);
		expect(facilities).toHaveLength(29);
		expect(facilities.find((facility) => facility.id === visible.id)?.place).toEqual(visible);
		expect(facilities.some((facility) => facility.id === hidden.id)).toBe(false);
	});
});
