import { env } from '$env/dynamic/private';
import { error, fail, redirect } from '@sveltejs/kit';
import { normalizeCampusEventInput } from '$lib/domain/campus-events';
import {
	deleteCampusEventImageRows,
	getAdminCampusEvent,
	insertCampusEventImages,
	replaceCampusEventImageOrder,
	setCampusEventVisibility,
	updateCampusEvent
} from '$lib/server/campus-events';
import { buildEventImagePlan, getEventImageFiles, parseStringArray, requireEventAdmin } from '$lib/server/event-admin';
import { createEventImageKey, deleteEventImages, putEventImage } from '$lib/server/event-media';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	requireEventAdmin(locals.user);
	const event = await getAdminCampusEvent(env.DATABASE_URL, params.id);
	if (!event) throw error(404, '행사를 찾지 못했습니다.');
	return {
		event,
		naverMapClientId: env.NAVER_MAP_CLIENT_ID ?? '',
		saved: url.searchParams.get('saved') === '1'
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params, platform }) => {
		requireEventAdmin(locals.user);
		const event = await getAdminCampusEvent(env.DATABASE_URL, params.id);
		if (!event) return fail(404, { message: '수정할 행사를 찾지 못했습니다.' });
		const formData = await request.formData();
		const newFiles = getEventImageFiles(formData);
		const imagePlan = buildEventImagePlan({
			existingImages: event.images,
			newFiles,
			orderedExistingIds: parseStringArray(formData.get('orderedExistingIds')),
			removedIds: parseStringArray(formData.get('removedImageIds')),
			coverTarget: String(formData.get('coverTarget') ?? '')
		});
		if (!imagePlan.ok) return fail(400, { message: imagePlan.message });
		const parsed = normalizeCampusEventInput(formData, {
			coverImageCount: imagePlan.value.coverTarget ? 1 : 0
		});
		if (!parsed.ok) return fail(400, { message: parsed.message });

		const bucket = platform?.env?.EVENT_MEDIA;
		if ((newFiles.length > 0 || imagePlan.value.removedObjectKeys.length > 0) && !bucket) {
			return fail(503, { message: '행사 이미지 저장소를 사용할 수 없습니다.' });
		}

		const uploadedKeys: string[] = [];
		const newRows = [];
		try {
			for (const [index, file] of newFiles.entries()) {
				const imageId = crypto.randomUUID();
				const objectKey = createEventImageKey(params.id, imageId, file.type as 'image/jpeg' | 'image/png' | 'image/webp');
				await putEventImage(bucket!, objectKey, file);
				uploadedKeys.push(objectKey);
				newRows.push({
					id: imageId,
					eventId: params.id,
					objectKey,
					contentType: file.type,
					byteSize: file.size,
					displayOrder: imagePlan.value.keptExistingIds.length + index,
					isCover: false
				});
			}
			await insertCampusEventImages(env.DATABASE_URL, newRows);
			await updateCampusEvent(env.DATABASE_URL, params.id, { ...parsed.value, isVisible: false });
			const orderedIds = [...imagePlan.value.keptExistingIds, ...newRows.map((row) => row.id)];
			const coverImageId = imagePlan.value.coverTarget?.kind === 'existing'
				? imagePlan.value.coverTarget.id
				: imagePlan.value.coverTarget?.kind === 'new'
					? newRows[imagePlan.value.coverTarget.index]?.id
					: null;
			if (coverImageId) {
				await replaceCampusEventImageOrder(env.DATABASE_URL, params.id, orderedIds, coverImageId);
			}
			await deleteCampusEventImageRows(
				env.DATABASE_URL,
				params.id,
				imagePlan.value.removedImageIds
			);
			if (bucket && imagePlan.value.removedObjectKeys.length) {
				await deleteEventImages(bucket, imagePlan.value.removedObjectKeys).catch((error) => {
					console.error('행사 수정 후 R2 객체 정리 실패', {
						eventId: params.id,
						keys: imagePlan.value.removedObjectKeys,
						error
					});
				});
			}
			if (parsed.value.isVisible) await setCampusEventVisibility(env.DATABASE_URL, params.id, true);
		} catch (error) {
			if (bucket && uploadedKeys.length) await deleteEventImages(bucket, uploadedKeys).catch(() => undefined);
			if (newRows.length) {
				await deleteCampusEventImageRows(
					env.DATABASE_URL,
					params.id,
					newRows.map((row) => row.id)
				).catch(() => undefined);
			}
			console.error('행사 수정 실패', { eventId: params.id, error });
			return fail(500, { message: '행사를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
		}

		throw redirect(303, `/admin/events/${params.id}/edit?saved=1`);
	}
};
