import { describe, expect, it } from 'vitest';
import { getCommercialPolygonStyle } from './commercial-polygon';

describe('학교 밖 상권 polygon 스타일', () => {
	it('선택 구역을 비선택 구역보다 진하게 표시한다', () => {
		const selected = getCommercialPolygonStyle(true);
		const unselected = getCommercialPolygonStyle(false);

		expect(selected.strokeWeight).toBeGreaterThan(unselected.strokeWeight);
		expect(selected.strokeOpacity).toBeGreaterThan(unselected.strokeOpacity);
		expect(selected.fillOpacity).toBeGreaterThan(unselected.fillOpacity);
		expect(selected.fillColor).toBe('#a51c45');
	});
});
