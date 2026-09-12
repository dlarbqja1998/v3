import { afterEach, describe, expect, it, vi } from 'vitest';
import { getShuttleCountdown, getShuttleMarkerCountdown } from './shuttle-countdown';

afterEach(() => vi.unstubAllEnvs());

describe('지도 셔틀 출발 카운트다운', () => {
	it.each(['campus', 'jochewon-station-back'] as const)('%s 핀 위에는 평일의 남은 시간만 제공한다', (stopId) => {
		expect(getShuttleMarkerCountdown(new Date('2026-09-12T09:00:00+09:00'), stopId)).toBeNull();
		expect(getShuttleMarkerCountdown(new Date('2026-09-13T16:59:30+09:00'), stopId)).toBeNull();
		expect(getShuttleMarkerCountdown(new Date('2026-09-14T23:59:00+09:00'), stopId)).toBeNull();
		expect(getShuttleMarkerCountdown(new Date('2026-09-14T09:02:00+09:00'), stopId)?.status).toBe('scheduled');
	});
	it('한국 주말 경계로 라벨을 숨기고 월요일에는 다시 제공한다', () => {
		expect(getShuttleMarkerCountdown(new Date('2026-09-13T14:59:59Z'), 'campus')).toBeNull();
		expect(getShuttleMarkerCountdown(new Date('2026-09-13T15:00:00Z'), 'campus')?.status).toBe('scheduled');
	});
	it('같은 시각에도 두 정류장의 실제 다음 출발을 따로 계산한다', () => {
		const now = new Date('2026-09-14T09:02:00+09:00');
		expect(getShuttleCountdown(now, 'campus')).toMatchObject({ label: '8분 후', departureTime: '09:10', directionLabel: '조치원역행' });
		expect(getShuttleCountdown(now, 'jochewon-station-back')).toMatchObject({ label: '18분 후', departureTime: '09:20', directionLabel: '학교행' });
	});

	it.each([
		['09:09:00', '1분 후', false],
		['09:09:01', '59초 후', true],
		['09:09:58.500', '2초 후', true],
		['09:09:59.999', '1초 후', true],
		['09:10:00', '20분 후', false]
	])('%s에서 출발 경계를 넘기거나 음수를 표시하지 않는다', (time, label, isUrgent) => {
		expect(getShuttleCountdown(new Date(`2026-09-14T${time}+09:00`), 'campus')).toMatchObject({ label, isUrgent });
	});

	it('오송행을 조치원역행으로 잘못 표시하지 않는다', () => {
		expect(getShuttleCountdown(new Date('2026-09-14T18:09:01+09:00'), 'campus')).toMatchObject({ directionLabel: '오송역행', departureTime: '18:10', label: '59초 후' });
	});

	it('막차 이후·토요일에는 다음 날까지의 큰 분 수 대신 오늘 상태를 표시한다', () => {
		expect(getShuttleCountdown(new Date('2026-09-14T20:50:00+09:00'), 'campus')).toMatchObject({ status: 'finished', label: '오늘 운행 종료', secondsLeft: null });
		expect(getShuttleCountdown(new Date('2026-09-12T09:00:00+09:00'), 'campus')).toMatchObject({ status: 'no-service', label: '오늘 운행 없음' });
	});

	it('금요일 야간 운휴와 일요일 별도 시간표를 적용한다', () => {
		expect(getShuttleCountdown(new Date('2026-09-18T18:40:00+09:00'), 'campus').status).toBe('finished');
		expect(getShuttleCountdown(new Date('2026-09-13T16:59:30+09:00'), 'campus')).toMatchObject({ departureTime: '17:00', label: '30초 후' });
	});

	it.each(['UTC', 'America/Los_Angeles', 'Asia/Seoul'])('%s 기기에서도 한국 날짜·시각으로 계산한다', (timezone) => {
		vi.stubEnv('TZ', timezone);
		expect(getShuttleCountdown(new Date('2026-09-14T00:09:01Z'), 'campus').label).toBe('59초 후');
		// UTC에서는 아직 일요일이어도 한국에서는 월요일 첫차를 기다린다.
		expect(getShuttleCountdown(new Date('2026-09-13T15:00:00Z'), 'campus')).toMatchObject({ departureTime: '09:10', label: '550분 후' });
	});
});
