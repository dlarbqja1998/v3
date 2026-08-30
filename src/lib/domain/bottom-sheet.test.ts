import { describe, expect, it } from 'vitest';
import {
	clampBottomSheetHeight,
	getBottomSheetHeights,
	getMapAttributionBottomOffset,
	getNextBottomSheetDetent,
	getWeatherWidgetBottomOffset,
	resolveBottomSheetDetent
} from './bottom-sheet';

describe('바텀시트 높이', () => {
	it('화면과 하단 내비게이션 높이로 최소·중간·최대 단계를 계산한다', () => {
		expect(getBottomSheetHeights(844, 73)).toEqual({
			collapsed: 104,
			medium: 385.5,
			expanded: 630.3333333333334
		});
	});

	it('작은 화면에서는 세 단계가 사용 가능한 높이를 넘지 않는다', () => {
		expect(getBottomSheetHeights(200, 73)).toEqual({
			collapsed: 104,
			medium: 104,
			expanded: 104
		});
	});

	it('날씨 위젯은 활성 단계와 무관하게 최소 단계 바로 위에 고정한다', () => {
		expect(getWeatherWidgetBottomOffset(844, 73, 12)).toBe(189);
	});

	it('지도 출처 로고는 접힌 바텀시트 바로 위를 기준선으로 삼는다', () => {
		expect(getMapAttributionBottomOffset(844, 73)).toBe(177);
	});

	it('드래그 높이를 최소와 최대 단계 사이로 제한한다', () => {
		const heights = getBottomSheetHeights(844, 73);

		expect(clampBottomSheetHeight(80, heights)).toBe(104);
		expect(clampBottomSheetHeight(420, heights)).toBe(420);
		expect(clampBottomSheetHeight(700, heights)).toBe(630.3333333333334);
	});
});

describe('바텀시트 스냅', () => {
	it('천천히 놓으면 가장 가까운 단계에 스냅한다', () => {
		const heights = getBottomSheetHeights(844, 73);

		expect(resolveBottomSheetDetent(430, 0.1, 'medium', heights)).toBe('medium');
		expect(resolveBottomSheetDetent(560, -0.1, 'medium', heights)).toBe('expanded');
	});

	it('빠른 스와이프는 현재 단계에서 해당 방향의 다음 단계로 이동한다', () => {
		const heights = getBottomSheetHeights(844, 73);

		expect(resolveBottomSheetDetent(300, -0.6, 'collapsed', heights)).toBe('medium');
		expect(resolveBottomSheetDetent(500, 0.6, 'expanded', heights)).toBe('medium');
	});

	it('최소와 최대 단계 밖으로 이동하지 않는다', () => {
		expect(getNextBottomSheetDetent('collapsed', 'down')).toBe('collapsed');
		expect(getNextBottomSheetDetent('collapsed', 'up')).toBe('medium');
		expect(getNextBottomSheetDetent('medium', 'up')).toBe('expanded');
		expect(getNextBottomSheetDetent('expanded', 'up')).toBe('expanded');
	});
});
