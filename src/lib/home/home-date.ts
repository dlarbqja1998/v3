export function formatHomeDate(date: Date): string {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: 'Asia/Seoul',
		weekday: 'short',
		day: '2-digit',
		month: 'short'
	}).formatToParts(date);
	const getPart = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value.toUpperCase() ?? '';

	return `${getPart('weekday')} · ${getPart('day')} ${getPart('month')}`;
}
