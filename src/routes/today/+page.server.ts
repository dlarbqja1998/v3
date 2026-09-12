import { env } from '$env/dynamic/private';

import { getFestivalTodayEntry } from '$lib/domain/festival';
import { readFestivalDraft } from '$lib/server/festival-editor';
import { getCampusEventStatus, getInitialCampusEventTab } from '$lib/domain/campus-events';
import { listPublicCampusEvents } from '$lib/server/campus-events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const now = new Date();
	const events = await listPublicCampusEvents(env.DATABASE_URL, now);
	const festival = getFestivalTodayEntry((await readFestivalDraft(platform?.env?.GOLABAU_CACHE)).festival, now);
	return {
		festival,
		ongoingEvents: events.filter((event) => getCampusEventStatus(event, now) === 'ongoing'),
		upcomingEvents: events.filter((event) => getCampusEventStatus(event, now) === 'upcoming'),
		initialTab: festival?.status === 'ongoing' ? 'ongoing' as const : getInitialCampusEventTab(events, now)
	};
};
