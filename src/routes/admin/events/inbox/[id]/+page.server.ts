import { env } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';
import { getCandidateIssues, matchCandidateLocation, parseCandidateEdit } from '$lib/domain/event-candidates';
import { requireEventAdmin } from '$lib/server/event-admin';
import { getEventCandidate, saveEventCandidate, setCandidateReviewState } from '$lib/server/event-candidates';
import { listCampusSpots } from '$lib/server/campus-spots';
import { putEventImage, validateEventImage } from '$lib/server/event-media';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	requireEventAdmin(locals.user);
	const candidate = await getEventCandidate(env.DATABASE_URL, params.id);
	if (!candidate) error(404, '행사 후보를 찾지 못했습니다.');
	return { candidate, issues: getCandidateIssues(candidate), naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '' };
};

export const actions: Actions = {
	save: async ({ locals, params, request, platform }) => {
		requireEventAdmin(locals.user);
		const form = await request.formData();
		const candidate = await getEventCandidate(env.DATABASE_URL, params.id);
		const version = Number(form.get('version'));
		if (!candidate || candidate.version !== version || candidate.state !== 'pending') return fail(409, { message: '후보가 변경되었거나 처리되었습니다. 새로고침 후 다시 확인해 주세요.' });
		let draft;
		try { draft = matchCandidateLocation(parseCandidateEdit(form), await listCampusSpots(env.DATABASE_URL)); }
		catch (caught) { return fail(400, { message: caught instanceof Error ? caught.message : '입력 내용을 확인해 주세요.' }); }
		let coverImage = candidate.coverImage;
		let uploadedKey: string | null = null;
		const file = form.get('cover');
		if (file instanceof File && file.size > 0) {
			const validation = validateEventImage(file);
			if (!validation.ok) return fail(400, { message: validation.message });
			if (!platform?.env?.EVENT_MEDIA) return fail(503, { message: '이미지 저장소를 연결한 뒤 다시 시도해 주세요.' });
			const id = crypto.randomUUID();
			const key = `event-candidates/${candidate.id}/${id}.${file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1]}`;
			try { await putEventImage(platform.env.EVENT_MEDIA, key, file); }
			catch { return fail(400, { message: '이미지 내용을 확인하지 못했습니다. JPEG·PNG·WebP 파일로 다시 올려 주세요.' }); }
			uploadedKey = key; coverImage = { id, objectKey: key, contentType: validation.contentType, byteSize: file.size };
		}
		try {
			const updated = await saveEventCandidate(env.DATABASE_URL, { id: candidate.id, version, draft, coverImage, coverApproved: !!coverImage && form.get('coverApproved') === 'on', acknowledged: form.get('acknowledged') === 'on' });
			if (!updated) {
				if (uploadedKey) await platform?.env?.EVENT_MEDIA?.delete(uploadedKey).catch(() => undefined);
				return fail(409, { message: '저장 중 후보가 변경되었습니다. 새로고침 후 다시 확인해 주세요.' });
			}
		} catch {
			// 응답이 불확실한 경우 사용 중일 수 있는 새 이미지를 지우지 않는다.
			return fail(500, { message: '저장 결과를 확인하지 못했습니다. 새로고침해서 확인해 주세요.' });
		}
		return { message: '후보를 저장했습니다. 정보가 준비되면 승인함에서 선택해 게시해 주세요.' };
	},
	reject: async ({ locals, params, request }) => {
		const admin = requireEventAdmin(locals.user);
		const version = Number((await request.formData()).get('version'));
		if (!Number.isSafeInteger(version) || version < 1 || !await setCandidateReviewState(env.DATABASE_URL, params.id, version, 'rejected', admin.id)) return fail(409, { message: '후보가 변경되었습니다. 새로고침해 주세요.' });
		redirect(303, '/admin/events/inbox');
	},
	restore: async ({ locals, params, request }) => {
		const admin = requireEventAdmin(locals.user);
		const version = Number((await request.formData()).get('version'));
		if (!Number.isSafeInteger(version) || version < 1 || !await setCandidateReviewState(env.DATABASE_URL, params.id, version, 'pending', admin.id)) return fail(409, { message: '후보가 변경되었습니다. 새로고침해 주세요.' });
		redirect(303, `/admin/events/inbox/${params.id}`);
	}
};
