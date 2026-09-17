import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ dev: true, read: vi.fn() }));
vi.mock('$app/environment', () => ({ get dev() { return mocks.dev; } }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test' } }));
vi.mock('$lib/server/restaurants', () => ({ readRestaurantDetail: mocks.read }));
import { GET } from './+server';

const event = (host = 'localhost:5173') => ({ params: { id: 'place' }, url: new URL(`http://${host}/restaurants/place/detail.json`) });
beforeEach(() => { mocks.dev = true; mocks.read.mockReset(); });

describe('음식점 미리 읽기 공개 범위', () => {
	it('배포 환경과 외부 호스트는 공개 매장만 조회한다', async () => {
		mocks.read.mockResolvedValue({ place: { id: 'place' } });
		mocks.dev = false;
		expect((await GET(event() as never)).status).toBe(200);
		mocks.dev = true;
		expect((await GET(event('example.com') as never)).status).toBe(200);
		expect(mocks.read.mock.calls).toEqual([['test', 'place', 'public'], ['test', 'place', 'public']]);
	});
	it('없는 매장은 404로 반환하고 정상 데이터에 사용자 정보를 섞지 않는다', async () => {
		mocks.read.mockResolvedValueOnce(null);
		await expect(GET(event() as never)).rejects.toMatchObject({ status: 404 });
		mocks.read.mockResolvedValueOnce({ place: { id: 'place' } });
		const result = await GET(event() as never);
		expect(await result.json()).toEqual({ restaurant: { place: { id: 'place' } } });
		expect(result.headers.get('Cache-Control')).toBe('no-store');
		expect(mocks.read).toHaveBeenLastCalledWith('test', 'place', 'preview');
	});
	it('공개되지 않은 매장의 미리 읽기는 404로 반환한다', async () => {
		mocks.dev = false;
		mocks.read.mockResolvedValueOnce(null);
		await expect(GET(event('golabau.com') as never)).rejects.toMatchObject({ status: 404 });
		expect(mocks.read).toHaveBeenCalledWith('test', 'place', 'public');
	});
});
