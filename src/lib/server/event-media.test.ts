import { describe, expect, it } from 'vitest';
import {
	createEventImageKey,
	deleteEventImages,
	getEventImage,
	putEventImage,
	validateEventImage,
	type EventMediaBucket,
	type EventMediaObject
} from './event-media';

class MemoryBucket implements EventMediaBucket {
	objects = new Map<string, { bytes: Uint8Array; contentType?: string }>();

	async put(key: string, value: ArrayBuffer | ArrayBufferView, options?: { httpMetadata?: { contentType?: string } }) {
		const bytes = value instanceof ArrayBuffer
			? new Uint8Array(value)
			: new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
		this.objects.set(key, { bytes, contentType: options?.httpMetadata?.contentType });
	}

	async get(key: string): Promise<EventMediaObject | null> {
		const stored = this.objects.get(key);
		if (!stored) return null;
		return {
			body: stored.bytes,
			httpEtag: '"memory-etag"',
			httpMetadata: { contentType: stored.contentType }
		};
	}

	async delete(keys: string | string[]) {
		for (const key of Array.isArray(keys) ? keys : [keys]) this.objects.delete(key);
	}
}

function file(type: string, size: number, name = 'event.png') {
	const bytes = new Uint8Array(size);
	if (type === 'image/png' && size >= 8) bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	if (type === 'image/jpeg' && size >= 3) bytes.set([0xff, 0xd8, 0xff]);
	if (type === 'image/webp' && size >= 12) {
		bytes.set([0x52, 0x49, 0x46, 0x46], 0);
		bytes.set([0x57, 0x45, 0x42, 0x50], 8);
	}
	return new File([bytes], name, { type });
}

describe('행사 이미지 저장 계층', () => {
	it('JPEG, PNG, WebP 외 형식을 거부한다', () => {
		expect(validateEventImage(file('text/plain', 10))).toEqual({
			ok: false,
			message: 'JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.'
		});
	});

	it('10MB를 초과한 이미지를 거부한다', () => {
		expect(validateEventImage(file('image/png', 10 * 1024 * 1024 + 1))).toEqual({
			ok: false,
			message: '이미지 한 장은 10MB 이하여야 합니다.'
		});
	});

	it('MIME 형식에 맞는 행사별 객체 키를 만든다', () => {
		expect(createEventImageKey('event-id', 'image-id', 'image/webp')).toBe(
			'events/event-id/image-id.webp'
		);
		expect(createEventImageKey('event-id', 'image-id', 'image/jpeg')).toBe(
			'events/event-id/image-id.jpg'
		);
	});

	it('업로드한 이미지 바이트와 MIME 형식을 다시 읽을 수 있다', async () => {
		const bucket = new MemoryBucket();
		const image = file('image/png', 8);

		await putEventImage(bucket, 'events/e/i.png', image);
		const stored = await getEventImage(bucket, 'events/e/i.png');

		expect(stored?.httpMetadata?.contentType).toBe('image/png');
		expect(new Uint8Array(stored?.body as Uint8Array).slice(0, 4)).toEqual(
			new Uint8Array([0x89, 0x50, 0x4e, 0x47])
		);
	});

	it('F12로 MIME만 이미지로 속인 파일은 저장하지 않는다', async () => {
		const bucket = new MemoryBucket();
		const disguised = new File([new TextEncoder().encode('<script>alert(1)</script>')], 'fake.png', {
			type: 'image/png'
		});

		await expect(putEventImage(bucket, 'events/e/fake.png', disguised)).rejects.toThrow(
			'이미지 파일 내용이 올바르지 않습니다.'
		);
		expect(bucket.objects.size).toBe(0);
	});

	it('여러 이미지 키를 한 번에 삭제한다', async () => {
		const bucket = new MemoryBucket();
		await putEventImage(bucket, 'events/e/a.png', file('image/png', 8));
		await putEventImage(bucket, 'events/e/b.png', file('image/png', 8));

		await deleteEventImages(bucket, ['events/e/a.png', 'events/e/b.png']);

		expect(bucket.objects.size).toBe(0);
	});
});
