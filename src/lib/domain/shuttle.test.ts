import { describe, expect, it } from 'vitest';
import {
	getShuttleSchedulesForDate,
	getUpcomingShuttles,
	shuttleServiceNotices
} from './shuttle';

describe('정적 셔틀 시간표', () => {
	it('평일 학교 출발은 공식 시간표의 다음 출발 시간을 순서대로 제공한다', () => {
		const now = new Date(2026, 7, 24, 14, 5);

		expect(getUpcomingShuttles(now, 'campus', 3)).toMatchObject([
			{ departureTime: '14:10', to: 'jochewon-station-back' },
			{ departureTime: '14:30', to: 'jochewon-station-back' },
			{ departureTime: '15:00', to: 'jochewon-station-back' }
		]);
	});

	it('금요일에는 공식표에서 운휴로 표시한 19시 이후 평일 운행을 제외한다', () => {
		const now = new Date(2026, 7, 28, 18, 55);

		expect(getUpcomingShuttles(now, 'campus')).toEqual([]);
		expect(getUpcomingShuttles(now, 'jochewon-station-back')).toEqual([]);
	});

	it('일요일에는 별도 주말 시간표를 사용하고 토요일에는 운행하지 않는다', () => {
		const sunday = new Date(2026, 7, 23, 16, 20);
		const saturday = new Date(2026, 7, 22, 16, 20);

		expect(getUpcomingShuttles(sunday, 'jochewon-station-back', 1)).toMatchObject([
			{ departureTime: '16:30', to: 'campus' }
		]);
		expect(getShuttleSchedulesForDate(saturday)).toEqual([]);
	});

	it('오송역 경유 18시 10분 운행을 정적 시간표에 보존한다', () => {
		const monday = new Date(2026, 7, 24, 12, 0);

		expect(getShuttleSchedulesForDate(monday)).toContainEqual(
			expect.objectContaining({
				from: 'campus',
				to: 'osong',
				departureTime: '18:10',
				note: '조치원역 경유 · 오송역 종착'
			})
		);
	});

	it('오송역의 오전 안내와 18시 10분 종착 운행을 상단 안내용으로 함께 제공한다', () => {
		expect(shuttleServiceNotices).toMatchObject([
			{ time: '08:30', label: '오송역 6번 출구', note: '조치원역 경유 운행' },
			{ time: '18:10', label: '학교 출발', note: '조치원역 경유 · 오송역 종착' }
		]);
	});
});
