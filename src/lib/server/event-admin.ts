import { redirect } from '@sveltejs/kit';
import { validateEventImage } from '$lib/server/event-media';

export function requireEventAdmin(user: App.Locals['user']) {
	if (!user || user.role !== 'admin') throw redirect(303, '/my');
	return user;
}

type ExistingEventImage = {
	id: string;
	objectKey: string;
	isCover: boolean;
};

type EventImagePlanInput = {
	existingImages: ExistingEventImage[];
	newFiles: File[];
	orderedExistingIds: string[];
	removedIds: string[];
	coverTarget: string;
};

export type EventImagePlan = {
	keptExistingIds: string[];
	removedImageIds: string[];
	removedObjectKeys: string[];
	newFiles: File[];
	coverTarget: { kind: 'existing'; id: string } | { kind: 'new'; index: number } | null;
	finalImageCount: number;
};

export function buildEventImagePlan(
	input: EventImagePlanInput
): { ok: true; value: EventImagePlan } | { ok: false; message: string } {
	const existingById = new Map(input.existingImages.map((image) => [image.id, image]));
	const removedIds = [...new Set(input.removedIds)].filter((id) => existingById.has(id));
	const removedSet = new Set(removedIds);
	const keptIds = input.orderedExistingIds.filter(
		(id, index, values) => existingById.has(id) && !removedSet.has(id) && values.indexOf(id) === index
	);
	const expectedKeptIds = input.existingImages
		.map((image) => image.id)
		.filter((id) => !removedSet.has(id));

	if (keptIds.length !== expectedKeptIds.length) {
		return { ok: false, message: '기존 이미지 순서를 다시 확인해 주세요.' };
	}

	for (const file of input.newFiles) {
		const validation = validateEventImage(file);
		if (!validation.ok) return validation;
	}

	const finalImageCount = keptIds.length + input.newFiles.length;
	if (finalImageCount > 6) {
		return { ok: false, message: '행사 이미지는 최대 6장까지 등록할 수 있습니다.' };
	}

	let coverTarget: EventImagePlan['coverTarget'] = null;
	if (input.coverTarget.startsWith('new:')) {
		const index = Number(input.coverTarget.slice(4));
		if (!Number.isInteger(index) || index < 0 || index >= input.newFiles.length) {
			return { ok: false, message: '대표 이미지를 선택해 주세요.' };
		}
		coverTarget = { kind: 'new', index };
	} else if (keptIds.includes(input.coverTarget)) {
		coverTarget = { kind: 'existing', id: input.coverTarget };
	} else if (finalImageCount > 0) {
		return { ok: false, message: '대표 이미지를 선택해 주세요.' };
	}

	return {
		ok: true,
		value: {
			keptExistingIds: keptIds,
			removedImageIds: removedIds,
			removedObjectKeys: removedIds.map((id) => existingById.get(id)!.objectKey),
			newFiles: input.newFiles,
			coverTarget,
			finalImageCount
		}
	};
}

export function parseStringArray(value: FormDataEntryValue | null) {
	try {
		const parsed = JSON.parse(String(value ?? '[]'));
		return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
	} catch {
		return [];
	}
}

export function getEventImageFiles(formData: FormData) {
	return formData
		.getAll('images')
		.filter((value): value is File => value instanceof File && value.size > 0);
}
