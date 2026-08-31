import { describe, expect, it } from 'vitest';
import {
	CAMPUS_AREA_ID,
	buildMapAreaOptions,
	changeSelectedMapArea,
	getCommercialZoneBounds,
	getVisibleCommercialZones,
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

	it('특정 구역을 선택하면 지도에는 그 구역 하나만 표시한다', () => {
		expect(getVisibleCommercialZones(zones, 'front-gate')).toEqual([zones[0]]);
		expect(getVisibleCommercialZones(zones, 'missing')).toEqual([]);
	});
});

describe('지도 생활권 전환', () => {
	it('캠퍼스 선택은 학교 안으로, 상권 선택은 해당 학교 밖 구역으로 전환한다', () => {
		expect(changeSelectedMapArea(CAMPUS_AREA_ID)).toEqual({
			mode: 'campus',
			selectedZoneId: 'all'
		});
		expect(changeSelectedMapArea('front-gate')).toEqual({
			mode: 'outside',
			selectedZoneId: 'front-gate'
		});
	});

	it('캠퍼스와 주요 상권을 지정된 순서로 먼저 보여주고 나머지는 이름순으로 배치한다', () => {
		const unorderedZones: CommercialZone[] = [
			{ ...zones[1], id: 'jukrim', name: '죽림리' },
			{ ...zones[0], id: 'hongdae', name: '홍대사이' },
			{ ...zones[0], id: 'front-gate', name: '고대앞' },
			{ ...zones[1], id: 'sinheung', name: '신흥리' },
			{ ...zones[0], id: 'ukil', name: '욱일' },
			{ ...zones[1], id: 'station', name: '조치원역' }
		];

		expect(buildMapAreaOptions(unorderedZones).map((option) => option.name)).toEqual([
			'고려대학교 세종캠퍼스',
			'고대앞',
			'욱일',
			'홍대사이',
			'조치원역',
			'신흥리',
			'죽림리'
		]);
	});

	it('교외 준비 중 상태에서는 실제 상권 대신 비활성 안내 한 개만 제공한다', () => {
		expect(buildMapAreaOptions(zones, { outsideEnabled: false })).toEqual([
			{
				id: 'campus',
				name: '고려대학교 세종캠퍼스',
				shortName: '고려대 세종',
				mode: 'campus'
			},
			{
				id: 'outside-coming-soon',
				name: '교외 음식점',
				description: '학교 주변 상권은 준비 중이에요',
				mode: 'outside',
				disabled: true,
				badge: '준비 중'
			}
		]);
	});
});
