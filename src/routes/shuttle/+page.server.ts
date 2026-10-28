import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	if (url.searchParams.get('embedded') !== '1') {
		const params = new URLSearchParams(url.searchParams); params.set('view', 'shuttle');
		redirect(307, `/?${params}`);
	}
	return { initialShuttleStopId: url.searchParams.get('stop') === 'jochewon-station-back' ? 'jochewon-station-back' : 'campus' };
};
