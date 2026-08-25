import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
	initialShuttleStopId:
		url.searchParams.get('stop') === 'jochewon-station-back' ? 'jochewon-station-back' : 'campus'
});
