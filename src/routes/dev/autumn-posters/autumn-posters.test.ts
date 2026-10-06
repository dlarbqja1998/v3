import { beforeEach, describe, expect, it, vi } from 'vitest';
const runtime = vi.hoisted(() => ({ dev: true, readFile: vi.fn() }));
vi.mock('$app/environment', () => ({ get dev() { return runtime.dev; } }));
vi.mock('node:fs/promises', () => ({ readFile: runtime.readFile }));
import { GET } from './[id]/+server';

beforeEach(() => { runtime.dev = true; runtime.readFile.mockReset().mockResolvedValue(new Uint8Array([1, 2, 3])); });

describe('확보한 포스터의 로컬 제공', () => {
	it('로컬 개발 주소의 지정 포스터만 제공한다', async () => {
		const response = await GET({ url: new URL('http://127.0.0.1:5173/dev/autumn-posters/eco-up'), params: { id: 'eco-up' } } as never);
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('image/jpeg');
		expect(response.headers.get('cache-control')).toBe('private, no-store');
		expect(runtime.readFile).toHaveBeenCalledWith('.local/event-inbox/2026-10-06-posters/eco-up-poster.jpg');
	});
	it.each([['https://golabau.com', 'eco-up'], ['http://localhost.example.com', 'eco-up'], ['http://localhost', '../other'], ['http://localhost', 'constructor']])('허용하지 않은 주소·파일은 읽지 않는다: %s / %s', async (origin, id) => {
		await expect(GET({ url: new URL(origin), params: { id } } as never)).rejects.toMatchObject({ status: 404 });
		expect(runtime.readFile).not.toHaveBeenCalled();
	});
	it('운영 빌드에서는 로컬 주소로 요청해도 파일을 읽지 않는다', async () => {
		runtime.dev = false;
		await expect(GET({ url: new URL('http://localhost'), params: { id: 'jansasa' } } as never)).rejects.toMatchObject({ status: 404 });
		expect(runtime.readFile).not.toHaveBeenCalled();
	});
});
