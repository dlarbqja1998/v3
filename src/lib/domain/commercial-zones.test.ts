import { describe, expect, it } from 'vitest';
import {
	changeMapAreaMode,
	getCommercialZoneBounds,
	type CommercialZone
} from './commercial-zones';

const zones: CommercialZone[] = [
	{
		id: 'front-gate',
		name: '고대앞',
		center: { latitude: 36.6, longitude: 127.29 },
		boundary: [
			{ latitude: 36.59, longitude: 127.28 },
			{ latitude: 36.61, longitude: 127.3 }
		]
	},
	{
		id: 'station',
		name: '조치원역',
		center: { latitude: 36.61, longitude: 127.3 },
		boundary: [
			{ latitude: 36.6, longitude: 127.27 },
			{ latitude: 36.62, longitude: 127.31 }
		]
	}
];

describe('학교 밖 상권 지도 범위', () => {
	it('전체 선택은 모든 상권 polygon을 포함하는 범위를 반환한다', () => {
		expect(getCommercialZoneBounds(zones, 'all')).toEqual({
			north: 36.62,
			south: 36.59,
			east: 127.31,
			west: 127.27
		});
	});

	it('특정 구역은 해당 polygon 범위만 반환한다', () => {
		expect(getCommercialZoneBounds(zones, 'front-gate')).toEqual({
			north: 36.61,
			south: 36.59,
			east: 127.3,
			west: 127.28
		});
	});

	it('polygon이 비어 있으면 구역 중심 좌표를 범위로 사용한다', () => {
		const zoneWithoutBoundary: CommercialZone = {
			id: 'empty-zone',
			name: '빈 구역',
			center: { latitude: 36.605, longitude: 127.295 },
			boundary: []
		};

		expect(getCommercialZoneBounds([zoneWithoutBoundary], 'empty-zone')).toEqual({
			north: 36.605,
			south: 36.605,
			east: 127.295,
			west: 127.295
		});
	});

	it('존재하지 않는 구역을 선택하면 범위를 반환하지 않는다', () => {
		expect(getCommercialZoneBounds(zones, 'missing')).toBeNull();
	});
});

describe('지도 생활권 전환', () => {
	it('학교 안과 밖으로 전환할 때 선택 구역을 전체로 초기화한다', () => {
		expect(changeMapAreaMode('campus')).toEqual({ mode: 'campus', selectedZoneId: 'all' });
		expect(changeMapAreaMode('outside')).toEqual({ mode: 'outside', selectedZoneId: 'all' });
	});
});
