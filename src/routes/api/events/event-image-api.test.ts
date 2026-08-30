import { describe, expect, it } from 'vitest';
import {
	createEventImageResponse,
	type EventMediaBucket,
	type EventMediaObject
} from '$lib/server/event-media';

const image = {
	id: 'image-id',
	eventId: 'event-id',
	objectKey: 'events/event-id/image-id.webp',
	contentType: 'image/webp',
	byteSize: 3,
	displayOrder: 0,
	isCover: true,
	createdAt: new Date('2026-08-30T00:00:00.000Z')
};

class ImageBucket implements EventMediaBucket {
	async put() {}
	async delete() {}
	async get(): Promise<EventMediaObject> {
		return {
			body: new Uint8Array([1, 2, 3]),
			httpEtag: '"event-etag"',
			httpMetadata: { contentType: 'image/webp' }
		};
	}
}

describe('행사 이미지 API', () => {
	it('공개 행사 이미지를 캐시 헤더와 함께 반환한다', async () => {
		const response = await createEventImageResponse({
			isEventVisible: true,
			isAdmin: false,
			image,
			bucket: new ImageBucket()
		});

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/webp');
		expect(response.headers.get('etag')).toBe('"event-etag"');
		expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
	});

	it('비공개 행사 이미지는 일반 사용자에게 숨긴다', async () => {
		const response = await createEventImageResponse({
			isEventVisible: false,
			isAdmin: false,
			image,
			bucket: new ImageBucket()
		});

		expect(response.status).toBe(404);
	});

	it('관리자는 비공개 행사 이미지를 미리 볼 수 있다', async () => {
		const response = await createEventImageResponse({
			isEventVisible: false,
			isAdmin: true,
			image,
			bucket: new ImageBucket()
		});

		expect(response.status).toBe(200);
	});
});
