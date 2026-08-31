import { describe, expect, it } from 'vitest';
import {
	getCurrentShuttle,
	getNextAvailableShuttle,
	getShuttleSchedulesForDate,
	getUpcomingShuttles,
	orderShuttleTimeline,
	shuttleScheduleSource,
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
					note: '조치원역 경유 · 오송역 도착'
				})
			);
	});

	it('오송역의 오전 안내와 18시 10분 종착 운행을 상단 안내용으로 함께 제공한다', () => {
		expect(shuttleServiceNotices).toMatchObject([
			{ time: '08:30', label: '오송역 6번 출구 출발', note: '조치원역 경유' },
			{ time: '18:10', label: '학교 출발', note: '조치원역 경유 · 오송역 도착' }
		]);
	});

	it('운행 중에는 직전 출발을 운행차로 잡고, 시간표를 그 행부터 시작한다', () => {
		const now = new Date(2026, 7, 24, 14, 5);
		const schedules = getShuttleSchedulesForDate(now, 'campus');
		const current = getCurrentShuttle(now, 'campus');

		expect(current).toMatchObject({ departureTime: '13:50', from: 'campus' });
		expect(orderShuttleTimeline(schedules, current?.id).slice(0, 3)).toMatchObject([
			{ departureTime: '13:50' },
			{ departureTime: '14:10' },
			{ departureTime: '14:30' }
		]);
	});

	it('막차가 지난 뒤에는 운행차 없이 다음 운행일 첫차를 다음차로 제공한다', () => {
		const now = new Date(2026, 7, 24, 21, 0);
		const schedules = getShuttleSchedulesForDate(now, 'campus');

		expect(getCurrentShuttle(now, 'campus')).toBeNull();
		expect(orderShuttleTimeline(schedules).at(0)).toMatchObject({ departureTime: '09:10' });
		expect(getNextAvailableShuttle(now, 'campus')).toMatchObject({
			departureTime: '09:10',
			serviceDate: '2026-08-25'
		});
	});

	it('오송역 경유 정보는 별도 안내와 18시 10분 학교 출발 행으로 나눠 보존한다', () => {
		const monday = new Date(2026, 7, 24, 12, 0);

		expect(shuttleServiceNotices).toContainEqual(
			expect.objectContaining({ time: '08:30', label: '오송역 6번 출구 출발', note: '조치원역 경유' })
		);
		expect(getShuttleSchedulesForDate(monday, 'campus')).toContainEqual(
			expect.objectContaining({
				departureTime: '18:10',
				note: '조치원역 경유 · 오송역 도착'
			})
		);
	});

	it('2학기 공식표의 오송역 별도 운행과 08시 45분 2대 운행을 구분한다', () => {
		const monday = new Date(2026, 7, 31, 8, 0);
		const stationSchedules = getShuttleSchedulesForDate(monday, 'jochewon-station-back');
		const campusSchedules = getShuttleSchedulesForDate(monday, 'campus');

		expect(stationSchedules.find((schedule) => schedule.departureTime === '08:30')?.note).toBeUndefined();
		expect(stationSchedules.find((schedule) => schedule.departureTime === '08:45')).toMatchObject({
			vehicleCount: 2
		});
		const osongEvening = campusSchedules.find((schedule) => schedule.departureTime === '18:10');
		expect(osongEvening).toMatchObject({
			to: 'osong',
			note: '조치원역 경유 · 오송역 도착'
		});
		expect(osongEvening?.tag).toBeUndefined();
		expect(shuttleServiceNotices).toContainEqual({
			id: 'weekday-osong-0830',
			dayType: 'weekday',
			time: '08:30',
			label: '오송역 6번 출구 출발',
			note: '조치원역 경유'
		});
	});

	it('첨부된 2026학년도 2학기 공식 시간표를 출처로 기록한다', () => {
		expect(shuttleScheduleSource).toMatchObject({
			name: '2026학년도 2학기 학생 셔틀버스 시간표',
			verifiedAt: '2026-08-31'
		});
	});
});
