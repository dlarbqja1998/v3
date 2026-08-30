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

export async function putEventImage(bucket: EventMediaBucket, key: string, file: File) {
	await bucket.put(key, await file.arrayBuffer(), {
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
