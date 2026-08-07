import { describe, expect, it } from 'vitest';
import { getCampusPolygonStyle } from './campus-polygon';

describe('캠퍼스 바운더리 스타일', () => {
	it('선택한 구역을 더 뚜렷한 면과 외곽선으로 표시한다', () => {
		const inactive = getCampusPolygonStyle(false);
		const active = getCampusPolygonStyle(true);

		expect(active.fillOpacity).toBeGreaterThan(inactive.fillOpacity);
		expect(active.strokeWeight).toBeGreaterThan(inactive.strokeWeight);
	});
});
