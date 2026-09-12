import { getShuttleSchedulesForDate, type ShuttleStopId } from './shuttle';

export type ShuttleCountdown = {
	status: 'scheduled' | 'finished' | 'no-service';
	label: string;
	directionLabel: string;
	departureTime: string | null;
	secondsLeft: number | null;
	isUrgent: boolean;
};

const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 지도 핀 위에는 평일의 남은 출발 시간만 표시한다. 정류장 시간표 계산과 구분한다. */
export function getShuttleMarkerCountdown(now: Date, stopId: ShuttleStopId): ShuttleCountdown | null {
	const weekday = new Date(now.getTime() + KOREA_OFFSET_MS).getUTCDay();
	if (weekday === 0 || weekday === 6) return null;
	const countdown = getShuttleCountdown(now, stopId);
	return countdown.status === 'scheduled' && countdown.secondsLeft !== null && countdown.secondsLeft > 0 ? countdown : null;
}

/** 기기의 시간대와 관계없이 한국 날짜의 시간표를 실제 출발 시각과 비교한다. */
export function getShuttleCountdown(now: Date, stopId: ShuttleStopId): ShuttleCountdown {
	const korea = new Date(now.getTime() + KOREA_OFFSET_MS);
	const year = korea.getUTCFullYear();
	const month = korea.getUTCMonth();
	const day = korea.getUTCDate();
	// 기존 시간표 함수에는 한국 달력의 요일을 가진 날짜만 전달한다.
	const schedules = getShuttleSchedulesForDate(new Date(year, month, day, 12), stopId);
	const startOfDay = Date.UTC(year, month, day) - KOREA_OFFSET_MS;
	const defaultDirection = stopId === 'campus' ? '조치원역행' : '학교행';

	for (const schedule of schedules) {
		const [hour, minute] = schedule.departureTime.split(':').map(Number);
		const departure = startOfDay + (hour * 60 + minute) * 60_000;
		if (departure <= now.getTime()) continue;
		const secondsLeft = Math.ceil((departure - now.getTime()) / 1000);
		return {
			status: 'scheduled',
			label: secondsLeft < 60 ? `${secondsLeft}초 후` : `${Math.ceil(secondsLeft / 60)}분 후`,
			directionLabel: schedule.to === 'osong' ? '오송역행' : defaultDirection,
			departureTime: schedule.departureTime,
			secondsLeft,
			isUrgent: secondsLeft < 60
		};
	}

	return {
		status: schedules.length ? 'finished' : 'no-service',
		label: schedules.length ? '오늘 운행 종료' : '오늘 운행 없음',
		directionLabel: defaultDirection,
		departureTime: null,
		secondsLeft: null,
		isUrgent: false
	};
}
