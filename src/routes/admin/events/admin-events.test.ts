import { describe, expect, it } from 'vitest';
import { buildEventImagePlan, requireEventAdmin } from '$lib/server/event-admin';

const existingImages = [
	{ id: 'cover', objectKey: 'events/e/cover.webp', isCover: true },
	{ id: 'sub', objectKey: 'events/e/sub.webp', isCover: false }
];

function image(name: string) {
	return new File([new Uint8Array([1])], name, { type: 'image/webp' });
}

describe('행사 관리자 권한', () => {
	it('관리자가 아닌 사용자를 마이페이지로 돌려보낸다', () => {
		try {
			requireEventAdmin({ id: 2, role: 'user' } as App.Locals['user']);
			throw new Error('권한 검사가 실행되지 않았습니다.');
		} catch (caught) {
			expect(caught).toMatchObject({ status: 303, location: '/my' });
		}
	});

	it('관리자 계정은 그대로 반환한다', () => {
		const admin = { id: 1, role: 'admin' } as App.Locals['user'];
		expect(requireEventAdmin(admin)).toBe(admin);
	});
});

describe('행사 이미지 편집 계획', () => {
	it('삭제한 기존 이미지를 제외하고 신규 이미지를 대표로 지정한다', () => {
		const plan = buildEventImagePlan({
			existingImages,
			newFiles: [image('new.webp')],
			orderedExistingIds: ['sub'],
			removedIds: ['cover'],
			coverTarget: 'new:0'
		});

		expect(plan).toMatchObject({
			ok: true,
			value: {
				keptExistingIds: ['sub'],
				removedObjectKeys: ['events/e/cover.webp'],
				coverTarget: { kind: 'new', index: 0 },
				finalImageCount: 2
			}
		});
	});

	it('대표 이미지 선택이 없는 공개 저장 계획을 거부한다', () => {
		expect(
			buildEventImagePlan({
				existingImages: [],
				newFiles: [image('new.webp')],
				orderedExistingIds: [],
				removedIds: [],
				coverTarget: ''
			})
		).toEqual({ ok: false, message: '대표 이미지를 선택해 주세요.' });
	});

	it('전체 이미지가 6장을 넘으면 거부한다', () => {
		expect(
			buildEventImagePlan({
				existingImages,
				newFiles: [image('1.webp'), image('2.webp'), image('3.webp'), image('4.webp'), image('5.webp')],
				orderedExistingIds: ['cover', 'sub'],
				removedIds: [],
				coverTarget: 'cover'
			})
		).toEqual({ ok: false, message: '행사 이미지는 최대 6장까지 등록할 수 있습니다.' });
	});
});
