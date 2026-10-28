import { describe, expect, it } from 'vitest';
import { getLifestyleUrl, lifestyleHref, readLifestyleView, withoutLifestyle } from './navigation';
import { getFullscreenSheetHeights, resolveBottomSheetDetent } from '$lib/domain/bottom-sheet';

describe('지도 생활 시트', () => {
	it('얕은 이동 중 원래 경로가 그대로여도 방문 기록의 시트를 열고 닫는다', () => {
		const route = new URL('https://example.com/?view=today&detail=123');
		expect(readLifestyleView(getLifestyleUrl(route, '/?view=shuttle'))).toBe('shuttle');
		expect(readLifestyleView(getLifestyleUrl(route, '/'))).toBeNull();
		expect(getLifestyleUrl(route).searchParams.get('detail')).toBe('123');
	});
	it('지도의 구역·매장 위치는 보존하며 시트 주소만 제거한다', () => {
		expect(withoutLifestyle(new URL('https://example.com/?outside=hongik&restaurant=123&view=cafeteria&day=wed&cafeteria=faculty'))).toBe('/?outside=hongik&restaurant=123');
	});
	it('식당·요일·행사 상세를 다시 열 수 있는 주소를 만든다', () => {
		expect(lifestyleHref('cafeteria', { cafeteria: 'faculty', day: 'wed' })).toBe('/?view=cafeteria&cafeteria=faculty&day=wed');
		expect(readLifestyleView(new URL('https://example.com/?view=today&detail=123'))).toBe('today');
		expect(readLifestyleView(new URL('https://example.com/?view=unknown'))).toBeNull();
	});
	it('화면 높이가 바뀌어도 최대 높이는 실제 화면에 맞고 중간 높이를 넘지 않는다', () => {
		for (const height of [0, 240, 667, 844]) {
			const heights = getFullscreenSheetHeights(height);
			expect(heights.expanded).toBe(height);
			expect(heights.collapsed).toBeLessThanOrEqual(heights.medium);
			expect(heights.medium).toBeLessThanOrEqual(heights.expanded);
		}
	});
	it('위로 빠르게 밀면 전체 화면, 아래로 밀면 중간 높이로 복귀한다', () => {
		const heights = getFullscreenSheetHeights(844);
		expect(resolveBottomSheetDetent(600, -.6, 'medium', heights)).toBe('expanded');
		expect(resolveBottomSheetDetent(760, .6, 'expanded', heights)).toBe('medium');
	});
});
