import { describe, expect, it } from 'vitest';
import {
	DEFAULT_CAMPUS_BOUNDARIES_VISIBLE,
	DEFAULT_HOME_CAMPUS_SPOT_ID,
	DEFAULT_HOME_MAP_ZOOM,
	shouldShowCampusCenterMarker
} from './campus-boundary-visibility';

describe('캠퍼스 구역 기본 표시', () => {
	it('홈에 처음 들어오면 건물과 구역 바운더리를 표시한다', () => {
		expect(DEFAULT_CAMPUS_BOUNDARIES_VISIBLE).toBe(true);
	});

	it('홈의 기본 지도 중심은 신정문이다', () => {
		expect(DEFAULT_HOME_CAMPUS_SPOT_ID).toBe('new-main-gate');
	});

	it('홈의 기본 지도 확대 수준은 19다', () => {
		expect(DEFAULT_HOME_MAP_ZOOM).toBe(17);
	});

	it('선택한 구역에만 중앙 원을 표시한다', () => {
		expect(shouldShowCampusCenterMarker('', 'new-main-gate')).toBe(false);
		expect(shouldShowCampusCenterMarker('new-main-gate', 'new-main-gate')).toBe(true);
	});
});
