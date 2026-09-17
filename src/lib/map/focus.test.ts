import { describe, expect, it } from 'vitest';
import * as mapFocus from './focus';
import { getMapCenterBounds, getMarkerTargetRatio, getSheetAwareLatitudeOffset } from './focus';
import { shuttleStops } from '$lib/domain/shuttle';

describe('지도 핀 포커스 위치', () => {
	it('교외 상세에서 돌아오면 핀이 상단 필터와 시트 사이의 중앙에 놓인다', () => {
		const ratio = mapFocus.getAvailableMapMarkerTargetRatio({ mapHeight: 720, navigationHeight: 73, sheetHeight: 300, topOverlayHeight: 146 });
		expect(ratio * 720).toBeCloseTo((146 + 720 - 73 - 300) / 2);
		expect(ratio * 720).toBeGreaterThan(146 + 22);
	});
	it('첫 교외 구역 위치는 상단과 시트를 피하고 좁은 화면에도 지도 공간을 남긴다', () => {
		const regular = mapFocus.getOutsideMapFocusInsets(844, 188, 458);
		expect(regular.top).toBeGreaterThan(188);
		expect(regular.bottom).toBeGreaterThan(458);
		const compact = mapFocus.getOutsideMapFocusInsets(500, 188, 350);
		expect(500 - compact.top - compact.bottom).toBeGreaterThanOrEqual(120);
	});
	it('바텀시트 모드에서는 상단 1/6 영역의 중앙에 핀이 오도록 목표 비율을 잡는다', () => {
		expect(getMarkerTargetRatio('top-band')).toBeCloseTo(1 / 12, 6);
	});

	it('상단 1/6 중앙 목표에 맞춰 지도 중심을 아래로 이동할 위도 오프셋을 계산한다', () => {
		const offset = getSheetAwareLatitudeOffset({
			latitude: 36.61,
			zoom: 16,
			mapHeight: 840,
			focusMode: 'top-band'
		});

		expect(offset).toBeGreaterThan(0);
		expect(offset).toBeLessThan(0.007);
	});

	it('기본 모드에서는 기존 지도 홈의 고정 오프셋을 유지한다', () => {
		expect(
			getSheetAwareLatitudeOffset({
				latitude: 36.61,
				zoom: 16,
				mapHeight: 840,
				focusMode: 'default'
			})
		).toBe(0);
	});

	it('학식 장소 보기는 바텀시트 위의 남은 지도 영역 중앙에 핀을 두고 기존 선택 확대 수준을 유지한다', () => {
		const getPlaceFocusZoom = (mapFocus as unknown as Record<string, unknown>).getPlaceFocusZoom;
		const getAvailableMapMarkerTargetRatio = (
			mapFocus as unknown as Record<string, unknown>
		).getAvailableMapMarkerTargetRatio;

		expect(getMarkerTargetRatio('default')).toBe(0.5);
		expect(getPlaceFocusZoom).toBeTypeOf('function');
		expect((getPlaceFocusZoom as (homeZoom: number) => number)(16)).toBe(19);
		expect(getAvailableMapMarkerTargetRatio).toBeTypeOf('function');
		expect(
			(getAvailableMapMarkerTargetRatio as (layout: {
				mapHeight: number;
				navigationHeight: number;
				sheetHeight: number;
			}) => number)({ mapHeight: 720, navigationHeight: 73, sheetHeight: 160 })
		).toBeCloseTo(487 / 1440, 6);
	});

	it('선택된 장소가 있으면 캠퍼스 기본 영역으로 다시 포커스하지 않는다', () => {
		const shouldFocusMapArea = (mapFocus as unknown as Record<string, unknown>).shouldFocusMapArea;

		expect(shouldFocusMapArea).toBeTypeOf('function');
		expect((shouldFocusMapArea as (activePlaceId: string) => boolean)('cafeteria-jinri')).toBe(false);
		expect((shouldFocusMapArea as (activePlaceId: string) => boolean)('')).toBe(true);
	});

	it('조치원역 후편 핀도 상단 1/6 중앙에 둘 수 있도록 남쪽 지도 중심 경계를 열어둔다', () => {
		const stationBack = shuttleStops.find((stop) => stop.stopId === 'jochewon-station-back');
		if (!stationBack) throw new Error('조치원역 후편 정류장 데이터가 없습니다.');

		const offset = getSheetAwareLatitudeOffset({
			latitude: stationBack.latitude,
			zoom: 16,
			mapHeight: 840,
			focusMode: 'top-band'
		});
		const requiredCenterLatitude = stationBack.latitude - offset;

		expect(getMapCenterBounds().south).toBeLessThanOrEqual(requiredCenterLatitude);
	});
});
