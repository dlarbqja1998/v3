import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { listCampusSpots } from '$lib/server/campus-spots';
import { readCampusAreaBoundary } from '$lib/server/campus-area-boundary';

export async function GET({ platform }: { platform: App.Platform | undefined }) {
	const [spots, campusAreaBoundary] = await Promise.all([
		listCampusSpots(env.DATABASE_URL, platform?.env?.GOLABAU_CACHE),
		readCampusAreaBoundary(env.DATABASE_URL)
	]);
	// 관리자가 저장한 전체 경계가 다음 지도 진입부터 바로 보이도록 재검증한다.
	return json({ spots, campusAreaBoundary }, { headers: { 'cache-control': 'no-cache' } });
}
