import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { normalizeCampusEventInput } from '$lib/domain/campus-events';
import { createCampusEvent, deleteCampusEventRows, insertCampusEventImages, setCampusEventVisibility } from '$lib/server/campus-events';
import { buildEventImagePlan, getEventImageFiles, requireEventAdmin } from '$lib/server/event-admin';
import { createEventImageKey, deleteEventImages, putEventImage } from '$lib/server/event-media';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireEventAdmin(locals.user);
	return { naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '' };
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		const admin = requireEventAdmin(locals.user);
		const formData = await request.formData();
		const newFiles = getEventImageFiles(formData);
		const imagePlan = buildEventImagePlan({
			existingImages: [],
			newFiles,
			orderedExistingIds: [],
			removedIds: [],
			coverTarget: String(formData.get('coverTarget') ?? '')
		});
		if (!imagePlan.ok) return fail(400, { message: imagePlan.message });
		const parsed = normalizeCampusEventInput(formData, {
			coverImageCount: imagePlan.value.coverTarget ? 1 : 0
		});
		if (!parsed.ok) return fail(400, { message: parsed.message });

		const bucket = platform?.env?.EVENT_MEDIA;
		if (newFiles.length > 0 && !bucket) {
			return fail(503, { message: '행사 이미지 저장소를 사용할 수 없습니다.' });
		}

		const eventId = crypto.randomUUID();
		const uploadedKeys: string[] = [];
		try {
			await createCampusEvent(
				env.DATABASE_URL,
				admin.id,
				{ ...parsed.value, isVisible: false },
				undefined,
				eventId
			);
			const imageRows = [];
			for (const [index, file] of newFiles.entries()) {
				const imageId = crypto.randomUUID();
				const objectKey = createEventImageKey(eventId, imageId, file.type as 'image/jpeg' | 'image/png' | 'image/webp');
				await putEventImage(bucket!, objectKey, file);
				uploadedKeys.push(objectKey);
				imageRows.push({
					id: imageId,
					eventId,
					objectKey,
					contentType: file.type,
					byteSize: file.size,
					displayOrder: index,
					isCover: imagePlan.value.coverTarget?.kind === 'new' && imagePlan.value.coverTarget.index === index
				});
			}
			await insertCampusEventImages(env.DATABASE_URL, imageRows);
			if (parsed.value.isVisible) {
				await setCampusEventVisibility(env.DATABASE_URL, eventId, true);
			}
		} catch (error) {
			if (bucket && uploadedKeys.length) await deleteEventImages(bucket, uploadedKeys).catch(() => undefined);
			await deleteCampusEventRows(env.DATABASE_URL, eventId).catch(() => undefined);
			console.error('행사 등록 실패', { eventId, error });
			return fail(500, { message: '행사를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
		}

		throw redirect(303, `/admin/events/${eventId}/edit?saved=1`);
	}
};
