import { describe, expect, it } from 'vitest';
import { getCommercialPolygonStyle } from './commercial-polygon';

describe('학교 밖 상권 polygon 스타일', () => {
	it('구역 내부를 채우지 않고 선택한 구역의 경계만 표시한다', () => {
		const selected = getCommercialPolygonStyle(true);
		const unselected = getCommercialPolygonStyle(false);

		expect(selected.strokeWeight).toBeGreaterThan(unselected.strokeWeight);
		expect(selected.strokeOpacity).toBeGreaterThan(unselected.strokeOpacity);
		expect(selected.fillOpacity).toBe(0);
		expect(unselected.fillOpacity).toBe(0);
		expect(unselected.strokeOpacity).toBe(0);
	});
});
