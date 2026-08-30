import { env } from '$env/dynamic/private';
import { getCampusEventStatus, getInitialCampusEventTab } from '$lib/domain/campus-events';
import { listPublicCampusEvents } from '$lib/server/campus-events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const events = await listPublicCampusEvents(env.DATABASE_URL, now);
	return {
		ongoingEvents: events.filter((event) => getCampusEventStatus(event, now) === 'ongoing'),
		upcomingEvents: events.filter((event) => getCampusEventStatus(event, now) === 'upcoming'),
		initialTab: getInitialCampusEventTab(events, now)
	};
};
