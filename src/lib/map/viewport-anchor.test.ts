import { describe, expect, it } from 'vitest';
import { createViewportAnchor } from './viewport-anchor';

describe('구역 판정점 고정', () => {
	it('시트를 펼치거나 교외 필터 높이가 달라져도 탐색 중에는 같은 지점을 판정한다', () => {
		const anchor = createViewportAnchor();
		const first = anchor.resolve({ mapHeight: 800, topOverlayHeight: 100, bottomOverlayHeight: 177 });
		expect(anchor.resolve({ mapHeight: 800, topOverlayHeight: 145, bottomOverlayHeight: 427 })).toBe(first);
		expect(anchor.resolve({ mapHeight: 800, topOverlayHeight: 189, bottomOverlayHeight: 177 })).toBe(first);
	});

	it('사용자가 장소를 눌러 지도를 새로 맞추면 새 구도에 맞는 판정점을 사용한다', () => {
		const anchor = createViewportAnchor();
		anchor.resolve({ mapHeight: 800, topOverlayHeight: 100, bottomOverlayHeight: 177 });
		anchor.reset();
		expect(anchor.resolve({ mapHeight: 800, topOverlayHeight: 145, bottomOverlayHeight: 427 })).toBe((145 + 800 - 427) / 1600);
	});
});
