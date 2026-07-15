import type { Place } from './places';

export type ShuttleStopId = 'campus' | 'jochewon-station-back';

export type ShuttleStop = Place & {
	stopId: ShuttleStopId;
};

export type ShuttleSchedule = {
	id: string;
	from: ShuttleStopId;
	to: ShuttleStopId | 'osong';
	departureTime: string;
	dayType: 'weekday';
	tag?: 'first' | 'last';
};

export type UpcomingShuttle = ShuttleSchedule & {
	fromName: string;
	toName: string;
	minutesLeft: number;
};

export const shuttleStops: ShuttleStop[] = [
	{
		id: 'shuttle-campus',
		stopId: 'campus',
		type: 'shuttle_stop',
		name: '학교 셔틀 정류장',
		categorySlug: 'shuttle',
		categoryName: '셔틀',
		zoneId: 'front-gate',
		latitude: 36.60948187479449,
		longitude: 127.28717680834059,
		description: '조치원역 후편으로 가는 교내 셔틀 탑승 지점',
		icon: '버스',
		isVisible: true,
		displayPriority: 1
	},
	{
		id: 'shuttle-jochewon-station-back',
		stopId: 'jochewon-station-back',
		type: 'shuttle_stop',
		name: '조치원역 후편',
		categorySlug: 'shuttle',
		categoryName: '셔틀',
		zoneId: 'station',
		latitude: 36.600356245236036,
		longitude: 127.29520662494268,
		description: '학교로 돌아오는 셔틀 탑승 지점',
		icon: '버스',
		isVisible: true,
		displayPriority: 2
	}
];

export const shuttleSchedules: ShuttleSchedule[] = [
	{ id: 'campus-0820', from: 'campus', to: 'jochewon-station-back', departureTime: '08:20', dayType: 'weekday' },
	{ id: 'station-0840', from: 'jochewon-station-back', to: 'campus', departureTime: '08:40', dayType: 'weekday' },
	{ id: 'campus-0920', from: 'campus', to: 'jochewon-station-back', departureTime: '09:20', dayType: 'weekday' },
	{ id: 'station-0940', from: 'jochewon-station-back', to: 'campus', departureTime: '09:40', dayType: 'weekday' },
	{ id: 'campus-1020', from: 'campus', to: 'jochewon-station-back', departureTime: '10:20', dayType: 'weekday' },
	{ id: 'station-1040', from: 'jochewon-station-back', to: 'campus', departureTime: '10:40', dayType: 'weekday' },
	{ id: 'campus-1120', from: 'campus', to: 'jochewon-station-back', departureTime: '11:20', dayType: 'weekday' },
	{ id: 'station-1140', from: 'jochewon-station-back', to: 'campus', departureTime: '11:40', dayType: 'weekday' },
	{ id: 'campus-1320', from: 'campus', to: 'jochewon-station-back', departureTime: '13:20', dayType: 'weekday' },
	{ id: 'station-1340', from: 'jochewon-station-back', to: 'campus', departureTime: '13:40', dayType: 'weekday' },
	{ id: 'campus-1420', from: 'campus', to: 'jochewon-station-back', departureTime: '14:20', dayType: 'weekday' },
	{ id: 'station-1440', from: 'jochewon-station-back', to: 'campus', departureTime: '14:40', dayType: 'weekday' },
	{ id: 'campus-1520', from: 'campus', to: 'jochewon-station-back', departureTime: '15:20', dayType: 'weekday' },
	{ id: 'station-1540', from: 'jochewon-station-back', to: 'campus', departureTime: '15:40', dayType: 'weekday' },
	{ id: 'campus-1620', from: 'campus', to: 'jochewon-station-back', departureTime: '16:20', dayType: 'weekday' },
	{ id: 'station-1640', from: 'jochewon-station-back', to: 'campus', departureTime: '16:40', dayType: 'weekday' },
	{ id: 'campus-1720', from: 'campus', to: 'jochewon-station-back', departureTime: '17:20', dayType: 'weekday' },
	{ id: 'station-1740', from: 'jochewon-station-back', to: 'campus', departureTime: '17:40', dayType: 'weekday' },
	{ id: 'campus-osong-first', from: 'campus', to: 'osong', departureTime: '07:30', dayType: 'weekday', tag: 'first' },
	{ id: 'campus-osong-last', from: 'campus', to: 'osong', departureTime: '18:10', dayType: 'weekday', tag: 'last' }
];

export function getStopName(stopId: ShuttleStopId | 'osong') {
	if (stopId === 'osong') return '오송역';
	return shuttleStops.find((stop) => stop.stopId === stopId)?.name ?? stopId;
}

export function getUpcomingShuttles(now: Date, from?: ShuttleStopId, limit = 5): UpcomingShuttle[] {
	const nowMinutes = now.getHours() * 60 + now.getMinutes();
	const todaysSchedules = shuttleSchedules
		.filter((schedule) => !from || schedule.from === from)
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
		.sort((a, b) => a.minutesLeft - b.minutesLeft);

	return todaysSchedules.slice(0, limit);
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
