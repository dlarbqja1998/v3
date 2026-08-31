export const EVENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const EVENT_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export type EventImageContentType = (typeof EVENT_IMAGE_TYPES)[number];

export type EventMediaObject = {
	body: unknown;
	httpEtag?: string;
	etag?: string;
	httpMetadata?: { contentType?: string };
};

export interface EventMediaBucket {
	put(
		key: string,
		value: ArrayBuffer | ArrayBufferView,
		options?: { httpMetadata?: { contentType?: string } }
	): Promise<unknown>;
	get(key: string): Promise<EventMediaObject | null>;
	delete(keys: string | string[]): Promise<unknown>;
}

export type ImageValidationResult =
	| { ok: true; contentType: EventImageContentType; byteSize: number }
	| { ok: false; message: string };

export function validateEventImage(file: File): ImageValidationResult {
	if (!EVENT_IMAGE_TYPES.includes(file.type as EventImageContentType)) {
		return { ok: false, message: 'JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.' };
	}
	if (file.size > EVENT_IMAGE_MAX_BYTES) {
		return { ok: false, message: '이미지 한 장은 10MB 이하여야 합니다.' };
	}
	if (file.size < 1) {
		return { ok: false, message: '비어 있는 이미지는 업로드할 수 없습니다.' };
	}
	return { ok: true, contentType: file.type as EventImageContentType, byteSize: file.size };
}

export function createEventImageKey(
	eventId: string,
	imageId: string,
	contentType: EventImageContentType
) {
	const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1];
	return `events/${eventId}/${imageId}.${extension}`;
}

function hasBytesAt(bytes: Uint8Array, expected: number[], offset = 0) {
	return expected.every((value, index) => bytes[offset + index] === value);
}

function hasValidImageSignature(contentType: EventImageContentType, bytes: Uint8Array) {
	if (contentType === 'image/jpeg') return hasBytesAt(bytes, [0xff, 0xd8, 0xff]);
	if (contentType === 'image/png') {
		return hasBytesAt(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	}
	return hasBytesAt(bytes, [0x52, 0x49, 0x46, 0x46]) && hasBytesAt(bytes, [0x57, 0x45, 0x42, 0x50], 8);
}

export async function putEventImage(bucket: EventMediaBucket, key: string, file: File) {
	const validation = validateEventImage(file);
	if (!validation.ok) throw new Error(validation.message);
	const buffer = await file.arrayBuffer();
	if (!hasValidImageSignature(validation.contentType, new Uint8Array(buffer))) {
		throw new Error('이미지 파일 내용이 올바르지 않습니다.');
	}
	await bucket.put(key, buffer, {
		httpMetadata: { contentType: file.type }
	});
}

export function getEventImage(bucket: EventMediaBucket, key: string) {
	return bucket.get(key);
}

export async function createEventImageResponse({
	isEventVisible,
	isAdmin,
	image,
	bucket
}: {
	isEventVisible: boolean;
	isAdmin: boolean;
	image: { objectKey: string; contentType: string };
	bucket: EventMediaBucket;
}) {
	if (!isEventVisible && !isAdmin) return new Response(null, { status: 404 });
	const object = await getEventImage(bucket, image.objectKey);
	if (!object) return new Response(null, { status: 404 });
	const headers = new Headers({
		'Content-Type': object.httpMetadata?.contentType ?? image.contentType,
		'Cache-Control': isEventVisible ? 'public, max-age=3600' : 'private, no-store'
	});
	const etag = object.httpEtag ?? object.etag;
	if (etag) headers.set('ETag', etag);
	return new Response(object.body as BodyInit, { status: 200, headers });
}

export async function deleteEventImages(bucket: EventMediaBucket, keys: string[]) {
	if (keys.length === 0) return;
	await bucket.delete(keys);
}
