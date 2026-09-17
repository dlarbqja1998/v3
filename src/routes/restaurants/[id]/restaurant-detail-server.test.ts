import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ dev: true, read: vi.fn() }));
vi.mock('$app/environment', () => ({ get dev() { return mocks.dev; } }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test' } }));
vi.mock('$lib/server/restaurants', () => ({ readRestaurantDetail: mocks.read }));
import { load } from './+page.server';

const event = (host = 'localhost:5173') => ({ params: { id: 'place' }, url: new URL(`http://${host}/restaurants/place`), locals: { user: null } });
beforeEach(() => { mocks.dev = true; mocks.read.mockReset(); });

describe('음식점 상세 공개 범위', () => {
	it('배포 빌드는 공개된 매장 조회만 허용한다', async () => {
		mocks.dev = false;
		mocks.read.mockResolvedValueOnce({ place: { id: 'place' } });
		await expect(load(event() as never)).resolves.toMatchObject({ restaurant: { place: { id: 'place' } } });
		expect(mocks.read).toHaveBeenCalledWith('test', 'place', 'public');
	});
	it('개발 서버의 외부 호스트에서도 미공개 매장은 노출하지 않는다', async () => {
		mocks.read.mockResolvedValueOnce(null);
		await expect(load(event('example.com') as never)).rejects.toMatchObject({ status: 404 });
		expect(mocks.read).toHaveBeenCalledWith('test', 'place', 'public');
	});
	it('로컬에서 검토가 끝난 매장만 상세를 반환한다', async () => {
		mocks.read.mockResolvedValueOnce(null);
		await expect(load(event() as never)).rejects.toMatchObject({ status: 404 });
		mocks.read.mockResolvedValueOnce({ place: { id: 'place', name: '네이버 매장명' } });
		await expect(load(event() as never)).resolves.toMatchObject({ restaurant: { place: { name: '네이버 매장명' } }, isAuthenticated: false });
		expect(mocks.read).toHaveBeenLastCalledWith('test', 'place', 'preview');
	});
});
