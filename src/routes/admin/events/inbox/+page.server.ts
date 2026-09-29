import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { EVENT_CANDIDATE_BATCH_LIMIT, getCandidateIssues } from '$lib/domain/event-candidates';
import { requireEventAdmin } from '$lib/server/event-admin';
import { publishEventCandidate, readEventInbox } from '$lib/server/event-candidates';
import { listCampusSpots } from '$lib/server/campus-spots';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireEventAdmin(locals.user);
	const [inbox, spots] = await Promise.all([readEventInbox(env.DATABASE_URL), listCampusSpots(env.DATABASE_URL)]);
	return { ...inbox, candidates: inbox.candidates.map((candidate) => ({ ...candidate, issues: getCandidateIssues(candidate, spots) })) };
};

export const actions: Actions = {
	publish: async ({ locals, request, platform }) => {
		const admin = requireEventAdmin(locals.user);
		const form = await request.formData();
		const values = [...new Set(form.getAll('candidate').map(String))];
		if (!values.length || values.length > EVENT_CANDIDATE_BATCH_LIMIT || values.some((value) => !/^[0-9a-f-]{36}:\d{1,9}$/i.test(value))) return fail(400, { message: `한 번에 게시할 행사를 1~${EVENT_CANDIDATE_BATCH_LIMIT}개 선택해 주세요.`, results: [] });
		const spots = await listCampusSpots(env.DATABASE_URL, platform?.env?.GOLABAU_CACHE);
		const results = [];
		for (const value of values) {
			const [id, version] = value.split(':');
			try { results.push({ id, ...await publishEventCandidate(env.DATABASE_URL, id, Number(version), admin.id, spots, platform?.env?.EVENT_MEDIA) }); }
			catch { results.push({ id, ok: false, message: '저장하지 못했습니다. 해당 후보를 다시 시도해 주세요.' }); }
		}
		const succeeded = results.filter((result) => result.ok).length;
		return { message: `${succeeded}개 게시 완료${succeeded < results.length ? ` · ${results.length - succeeded}개 확인 필요` : ''}`, results };
	}
};
