import type { Place } from './places';

export type ShuttleStopId = 'campus' | 'jochewon-station-back';
export type ShuttleDestinationId = ShuttleStopId | 'osong';
export type ShuttleServiceDay = 'weekday' | 'sunday';

export type ShuttleStop = Place & {
	stopId: ShuttleStopId;
};

export type ShuttleSchedule = {
	id: string;
	from: ShuttleStopId;
	to: ShuttleDestinationId;
	departureTime: string;
	dayType: ShuttleServiceDay;
	note?: string;
	tag?: 'first' | 'last';
	fridayUnavailable?: boolean;
};

export type ShuttleServiceNotice = {
	id: string;
	dayType: ShuttleServiceDay;
	time: string;
	label: string;
	note: string;
};

export type UpcomingShuttle = ShuttleSchedule & {
	fromName: string;
	toName: string;
	minutesLeft: number;
};

export const shuttleScheduleSource = {
	name: '고려대학교 세종캠퍼스 셔틀버스 안내',
	url: 'https://kusemicon.korea.ac.kr/koreaSejong/7803/subview.do',
	verifiedAt: '2026-08-25'
} as const;

export const shuttleStops: ShuttleStop[] = [
	{
		id: 'shuttle-campus',
		stopId: 'campus',
		type: 'shuttle_stop',
		name: '학술정보원 앞 셔틀버스 정류장',
		categorySlug: 'shuttle',
		categoryName: '셔틀',
		zoneId: 'front-gate',
		latitude: 36.60948187479449,
		longitude: 127.28717680834059,
		description: '조치원역과 오송역으로 출발하는 교내 셔틀 탑승 지점입니다.',
		icon: '버스',
		isVisible: true,
		displayPriority: 1
	},
	{
		id: 'shuttle-jochewon-station-back',
		stopId: 'jochewon-station-back',
		type: 'shuttle_stop',
		name: '조치원역 뒷편 셔틀버스 정류장',
		categorySlug: 'shuttle',
		categoryName: '셔틀',
		zoneId: 'station',
		latitude: 36.600356245236036,
		longitude: 127.29520662494268,
		description: '조치원역 버스정류장 옆, 학교로 돌아오는 셔틀 탑승 지점입니다.',
		icon: '버스',
		isVisible: true,
		displayPriority: 2
	}
];

const weekdayCampusTimes = [
	'09:10', '09:30', '09:40', '09:50', '10:10', '10:30', '10:40', '11:00', '11:20',
	'11:40', '12:10', '12:30', '12:40', '13:10', '13:30', '13:50', '14:10', '14:30',
	'15:00', '15:10', '15:30', '15:50', '16:10', '16:30', '16:50', '17:10', '17:20',
	'17:40', '18:20', '18:40', '19:10', '19:40', '20:10', '20:50'
];

const weekdayStationTimes = [
	'08:30', '08:45', '09:20', '09:40', '09:50', '10:00', '10:20', '10:40', '10:50',
	'11:10', '11:30', '11:50', '12:20', '12:40', '12:50', '13:20', '13:40', '14:00',
	'14:20', '14:40', '15:10', '15:20', '15:40', '16:00', '16:20', '16:40', '17:00',
	'17:20', '17:30', '17:50', '18:30', '18:50', '19:20', '19:50', '20:20', '21:00'
];

const sundayCampusTimes = ['17:00', '17:40', '18:40', '19:00', '19:40', '20:20', '21:10'];
const sundayStationTimes = ['16:30', '17:10', '17:50', '18:50', '19:10', '19:50', '20:35', '21:20'];

function createScheduleRows({
	dayType,
	from,
	to,
	times,
	fridayUnavailableFrom
}: {
	dayType: ShuttleServiceDay;
	from: ShuttleStopId;
	to: ShuttleDestinationId;
	times: string[];
	fridayUnavailableFrom?: string;
}): ShuttleSchedule[] {
	return times.map((departureTime) => ({
		id: `${dayType}-${from}-${departureTime.replace(':', '')}`,
		from,
		to,
		departureTime,
		dayType,
		fridayUnavailable: Boolean(
			fridayUnavailableFrom && timeToMinutes(departureTime) >= timeToMinutes(fridayUnavailableFrom)
		)
	}));
}

/** 외부 요청 없이 번들에 포함하는 고려대 세종캠퍼스 공식 셔틀 시간표입니다. */
export const shuttleSchedules: ShuttleSchedule[] = [
	...createScheduleRows({
		dayType: 'weekday',
		from: 'campus',
		to: 'jochewon-station-back',
		times: weekdayCampusTimes,
		fridayUnavailableFrom: '19:10'
	}),
	{
		id: 'weekday-campus-1810-osong',
		from: 'campus',
		to: 'osong',
		departureTime: '18:10',
		dayType: 'weekday',
		tag: 'last',
		note: '조치원역 경유 · 오송역 종착'
	},
	...createScheduleRows({
		dayType: 'weekday',
		from: 'jochewon-station-back',
		to: 'campus',
		times: weekdayStationTimes,
		fridayUnavailableFrom: '19:20'
	}),
	...createScheduleRows({
		dayType: 'sunday',
		from: 'campus',
		to: 'jochewon-station-back',
		times: sundayCampusTimes
	}),
	...createScheduleRows({
		dayType: 'sunday',
		from: 'jochewon-station-back',
		to: 'campus',
		times: sundayStationTimes
	})
];

/** 출발지가 표에 명시되지 않은 공식 안내 항목은 경로를 추정하지 않고 별도 안내로 노출합니다. */
export const shuttleServiceNotices: ShuttleServiceNotice[] = [
	{
		id: 'weekday-osong-0830',
		dayType: 'weekday',
		time: '08:30',
		label: '오송역 6번 출구',
		note: '조치원역 경유 운행'
	},
	{
		id: 'weekday-campus-1810-osong',
		dayType: 'weekday',
		time: '18:10',
		label: '학교 출발',
		note: '조치원역 경유 · 오송역 종착'
	}
];

export function getShuttleStopLabel(stopId: ShuttleStopId) {
	return stopId === 'campus' ? '학교 출발' : '조치원역 출발';
}

export function getStopName(stopId: ShuttleDestinationId) {
	if (stopId === 'osong') return '오송역';
	return shuttleStops.find((stop) => stop.stopId === stopId)?.name ?? stopId;
}

export function getShuttleServiceDay(date: Date): ShuttleServiceDay | null {
	if (date.getDay() === 0) return 'sunday';
	if (date.getDay() >= 1 && date.getDay() <= 5) return 'weekday';
	return null;
}

export function getShuttleSchedulesForDate(date: Date, from?: ShuttleStopId): ShuttleSchedule[] {
	const serviceDay = getShuttleServiceDay(date);
	if (!serviceDay) return [];

	return shuttleSchedules
		.filter(
			(schedule) =>
				schedule.dayType === serviceDay &&
				!((date.getDay() === 5 && schedule.fridayUnavailable) || (from && schedule.from !== from))
		)
		.toSorted((first, second) => timeToMinutes(first.departureTime) - timeToMinutes(second.departureTime));
}

export function getUpcomingShuttles(now: Date, from?: ShuttleStopId, limit = 5): UpcomingShuttle[] {
	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	return getShuttleSchedulesForDate(now, from)
		.map((schedule) => {
			const departureMinutes = timeToMinutes(schedule.departureTime);
			return {
				...schedule,
				fromName: getStopName(schedule.from),
				toName: getStopName(schedule.to),
				minutesLeft: departureMinutes - nowMinutes
			};
		})
		.filter((schedule) => schedule.minutesLeft >= 0)
		.slice(0, limit);
}

export function formatMinutesLeft(minutes: number) {
	if (minutes <= 0) return '곧 출발';
	if (minutes < 60) return `${minutes}분 후`;

	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return rest > 0 ? `${hours}시간 ${rest}분 후` : `${hours}시간 후`;
}

function timeToMinutes(time: string) {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}
