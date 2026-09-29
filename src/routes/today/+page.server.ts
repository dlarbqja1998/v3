import { env } from '$env/dynamic/private';

import { getFestivalTodayEntry } from '$lib/domain/festival';
import { readFestivalForPage } from '$lib/server/festival-catalog';
import { getCampusEventStatus, getInitialCampusEventTab, getPublicCampusEvents } from '$lib/domain/campus-events';
import { listPublicCampusEvents } from '$lib/server/campus-events';
import { readLocalEventPreviews } from '$lib/server/event-preview';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url, locals }) => {
	const now = new Date();
	const hostname = url?.hostname ?? '';
	const [publicEvents, previewEvents, publicFestival] = await Promise.all([
		listPublicCampusEvents(env.DATABASE_URL, now),
		readLocalEventPreviews(env.DATABASE_URL, hostname, locals?.user?.role === 'admin', now),
		readFestivalForPage(hostname, platform?.env?.GOLABAU_CACHE, env.DATABASE_URL)
	]);
	const events = getPublicCampusEvents([...publicEvents, ...previewEvents], now).filter((event) => event.id !== publicFestival?.eventId);
	const festival = publicFestival ? getFestivalTodayEntry(publicFestival, now) : null;
	return {
		festival,
		ongoingEvents: events.filter((event) => getCampusEventStatus(event, now) === 'ongoing'),
		upcomingEvents: events.filter((event) => getCampusEventStatus(event, now) === 'upcoming'),
		initialTab: festival?.status === 'ongoing' ? 'ongoing' as const : getInitialCampusEventTab(events, now)
	};
};
