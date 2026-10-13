import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import * as schema from './db/schema';

const state = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('$lib/server/db', () => ({ createDb: () => state.db }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'test', NAVER_MAP_CLIENT_ID: 'test' } }));

import { CAMPUS_BOUNDARY_SLUG } from './campus-area-boundary';
import { getCampusAreaBoundary } from '$lib/map/campus-area-boundary';
import { load, actions } from '../../routes/admin/boundary-editor/+page.server';
import { GET } from '../../routes/api/map/campus-spots/+server';

let pg: PGlite;
let db: ReturnType<typeof drizzle<typeof schema>>;
const buildingBoundary = [
	{ latitude: 36.609, longitude: 127.287 },
	{ latitude: 36.609, longitude: 127.288 },
	{ latitude: 36.610, longitude: 127.288 }
];
const wholeBoundary = [
	{ latitude: 36.607, longitude: 127.281 },
	{ latitude: 36.607, longitude: 127.292 },
	{ latitude: 36.613, longitude: 127.292 },
	{ latitude: 36.613, longitude: 127.281 }
];
const admin = { id: 1, role: 'admin' };

beforeAll(async () => {
	pg = new PGlite();
	await pg.exec(readFileSync('drizzle/0000_cute_bullseye.sql', 'utf8'));
	await pg.exec(readFileSync('drizzle/0003_tan_scarecrow.sql', 'utf8'));
	db = drizzle(pg, { schema });
	state.db = db;
}, 20000);

beforeEach(async () => {
	await pg.exec('TRUNCATE zones, campus_spots CASCADE;');
	await db.insert(schema.campusSpots).values({
		id: 'library', name: '학술정보원', type: 'building', source: 'designer-final',
		centerLatitude: 36.6095, centerLongitude: 127.2875, boundary: buildingBoundary
	});
	await db.insert(schema.zones).values({
		name: '고대앞', slug: 'front-gate', centerLatitude: 36.606, centerLongitude: 127.289,
		polygon: buildingBoundary, isVisible: true
	});
});

afterAll(async () => { await pg?.close(); });

function requestEvent(boundary: unknown = wholeBoundary, user: unknown = admin, id?: string) {
	const form = new FormData();
	form.set('boundary', JSON.stringify(boundary));
	form.set('name', '변경한 이름');
	if (id) form.set('id', id);
	return {
		locals: { user }, platform: undefined,
		url: new URL('https://golabau.com/admin/boundary-editor?mode=campus-area'),
		request: new Request('https://golabau.com/admin/boundary-editor?/saveCampusArea', { method: 'POST', body: form })
	} as never;
}

describe('캠퍼스 전체 경계 저장과 공개 지도 연결', () => {
	it('첫 편집에는 건물에서 만든 초안을 보여 주며 조회만으로 저장하지 않는다', async () => {
		const data = await load(requestEvent()) as any;
		expect(data).toMatchObject({ initialEditorMode: 'campus-area', campusAreaIsDraft: true });
		expect(data.campusAreaBoundary).toEqual(getCampusAreaBoundary([{ boundary: buildingBoundary }]));
		expect(await db.select().from(schema.zones).where(eq(schema.zones.slug, CAMPUS_BOUNDARY_SLUG))).toEqual([]);
	});

	it('관리자가 저장한 선을 공개 API와 편집기에 반영하고 기존 건물·상권은 유지한다', async () => {
		await expect(actions.saveCampusArea(requestEvent())).rejects.toMatchObject({ status: 303 });
		const response = await GET({ platform: undefined } as never);
		expect(response.headers.get('cache-control')).toBe('no-cache');
		expect(await response.json()).toMatchObject({
			campusAreaBoundary: wholeBoundary,
			spots: [{ id: 'library', boundary: buildingBoundary }]
		});
		const data = await load(requestEvent()) as any;
		expect(data.campusAreaIsDraft).toBe(false);
		expect(data.campusAreaBoundary).toEqual(wholeBoundary);
		expect(data.zones.map((zone: { slug: string }) => zone.slug)).toEqual(['front-gate']);
		expect(await db.select().from(schema.zones).where(eq(schema.zones.isVisible, true))).toHaveLength(1);
	});

	it('다시 저장하면 같은 경계 한 개를 갱신한다', async () => {
		await expect(actions.saveCampusArea(requestEvent())).rejects.toMatchObject({ status: 303 });
		const changed = wholeBoundary.map(point => ({ ...point, latitude: point.latitude + 0.001 }));
		await expect(actions.saveCampusArea(requestEvent(changed))).rejects.toMatchObject({ status: 303 });
		const rows = await db.select().from(schema.zones).where(eq(schema.zones.slug, CAMPUS_BOUNDARY_SLUG));
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ polygon: changed, isVisible: false });
	});

	it('관리자가 아니면 조회·저장을 허용하지 않는다', async () => {
		for (const user of [null, { id: 2, role: 'user' }]) {
			await expect(load(requestEvent(wholeBoundary, user))).rejects.toMatchObject({ status: 303 });
			await expect(actions.saveCampusArea(requestEvent(wholeBoundary, user))).rejects.toMatchObject({ status: 303 });
		}
		expect(await db.select().from(schema.zones).where(eq(schema.zones.slug, CAMPUS_BOUNDARY_SLUG))).toEqual([]);
	});

	it('잘못된 좌표·중복 점·일직선은 기존 저장값을 바꾸지 않는다', async () => {
		await expect(actions.saveCampusArea(requestEvent())).rejects.toMatchObject({ status: 303 });
		for (const invalid of [[], wholeBoundary.slice(0, 2),
			[...wholeBoundary.slice(0, 2), { latitude: 91, longitude: 127 }],
			Array(3).fill(wholeBoundary[0]),
			[36.607, 36.608, 36.609].map(latitude => ({ latitude, longitude: 127.281 }))
		]) {
			expect(await actions.saveCampusArea(requestEvent(invalid))).toMatchObject({ status: 400 });
		}
		expect((await db.select().from(schema.zones).where(eq(schema.zones.slug, CAMPUS_BOUNDARY_SLUG)))[0].polygon).toEqual(wholeBoundary);
	});

	it('상권 수정 요청으로 캠퍼스 전체 경계를 덮어쓰지 않는다', async () => {
		await expect(actions.saveCampusArea(requestEvent())).rejects.toMatchObject({ status: 303 });
		const [row] = await db.select().from(schema.zones).where(eq(schema.zones.slug, CAMPUS_BOUNDARY_SLUG));
		expect(await actions.updateZone(requestEvent(buildingBoundary, admin, row.id))).toMatchObject({ status: 404 });
		expect((await db.select().from(schema.zones).where(eq(schema.zones.id, row.id)))[0].polygon).toEqual(wholeBoundary);
	});
});
