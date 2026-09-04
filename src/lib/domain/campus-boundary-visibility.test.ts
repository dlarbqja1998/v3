import { describe, expect, it } from 'vitest';
import {
	DEFAULT_CAMPUS_BOUNDARIES_VISIBLE,
	DEFAULT_HOME_CAMPUS_SPOT_ID,
	DEFAULT_HOME_MAP_ZOOM,
	getCampusSpotFocusCenter,
	shouldShowCampusCenterMarker
} from './campus-boundary-visibility';

describe('캠퍼스 구역 기본 표시', () => {
	it('홈에 처음 들어오면 건물과 구역 바운더리를 표시한다', () => {
		expect(DEFAULT_CAMPUS_BOUNDARIES_VISIBLE).toBe(true);
	});

	it('홈의 기본 지도는 학술정보원을 기준으로 연다', () => {
		expect(DEFAULT_HOME_CAMPUS_SPOT_ID).toBe('building-학술정보원');
	});

	it('홈의 기본 중심은 학술정보원보다 서쪽으로 약 22m 보정한다', () => {
		const center = getCampusSpotFocusCenter(
			'building-학술정보원',
			{ latitude: 36.610068281818, longitude: 127.287120018182 },
			''
		);

		expect(center).toEqual({
			latitude: 36.610068281818,
			longitude: 127.286870018182
		});
	});

	it('학술정보원을 직접 선택하면 실제 시설 중심으로 이동한다', () => {
		const center = getCampusSpotFocusCenter(
			'building-학술정보원',
			{ latitude: 36.610068281818, longitude: 127.287120018182 },
			'building-학술정보원'
		);

		expect(center).toEqual({
			latitude: 36.610068281818,
			longitude: 127.287120018182
		});
	});

	it('홈의 기본 지도는 캠퍼스 전체가 보이도록 한 단계 넓게 시작한다', () => {
		expect(DEFAULT_HOME_MAP_ZOOM).toBe(16);
	});

	it('선택한 구역에만 중앙 원을 표시한다', () => {
		expect(shouldShowCampusCenterMarker('', 'new-main-gate')).toBe(false);
		expect(shouldShowCampusCenterMarker('new-main-gate', 'new-main-gate')).toBe(true);
	});
});
