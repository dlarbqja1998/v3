/** 행사가 시작된 한국 날짜의 연도로 기록을 분류한다. */
export function getEventHistoryYear(date: Date): number {
	return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(date));
}

export function selectEventHistoryYear<T extends { startsAt: Date }>(events: T[], requestedYear: string | null, now = new Date()) {
	const years = [...new Set([getEventHistoryYear(now), ...events.map((event) => getEventHistoryYear(event.startsAt))])].sort((a, b) => b - a);
	const selectedYear = years.includes(Number(requestedYear)) ? Number(requestedYear) : getEventHistoryYear(now);
	return {
		years,
		selectedYear,
		events: events.filter((event) => getEventHistoryYear(event.startsAt) === selectedYear)
			.toSorted((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
	};
}
