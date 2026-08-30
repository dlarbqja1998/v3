import { getCampusEventStatus, type CampusEventTimeRange } from '$lib/domain/campus-events';

const FACILITY_FILTER_ORDER = [
	'convenience-store',
	'cafe',
	'bookstore',
	'copy-room',
	'post-office',
	'crimson-store',
	'gym'
] as const;

export function getHomeEventFilterOrder<T extends { slug: string; name: string; icon: string }>(
	categories: readonly T[]
) {
	const order = new Map<string, number>(FACILITY_FILTER_ORDER.map((slug, index) => [slug, index]));
	return [
		{ slug: 'event', name: '행사', icon: 'event' },
		...[...categories].sort(
			(a, b) => (order.get(a.slug) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.slug) ?? Number.MAX_SAFE_INTEGER)
		)
	];
}

export function getInitialHomeEventId<T extends { id: string }>(events: T[], requestedId: string) {
	return events.some((event) => event.id === requestedId) ? requestedId : (events[0]?.id ?? '');
}

export function getEventSpotlight<T extends CampusEventTimeRange>(events: T[], now = new Date()) {
	return [...events]
		.filter((event) => getCampusEventStatus(event, now) !== 'ended')
		.sort((a, b) => {
			const aStatus = getCampusEventStatus(a, now);
			const bStatus = getCampusEventStatus(b, now);
			if (aStatus !== bStatus) return aStatus === 'ongoing' ? -1 : 1;
			return aStatus === 'ongoing'
				? a.endsAt.getTime() - b.endsAt.getTime()
				: a.startsAt.getTime() - b.startsAt.getTime();
		})[0] ?? null;
}
