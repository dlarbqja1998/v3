import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listAdminNotices, createNotice, updateNotice } = vi.hoisted(() => ({
	listAdminNotices: vi.fn(),
	createNotice: vi.fn(),
	updateNotice: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('$lib/server/notices', () => ({ listAdminNotices, createNotice, updateNotice }));

import { actions, load } from './+page.server';

const admin = { id: 1, role: 'admin' };
const user = { id: 2, role: 'user' };

function noticeForm(id?: string) {
	const form = new FormData();
	if (id) form.set('id', id);
	form.set('title', '서비스 점검 안내');
	form.set('content', '서비스 점검이 오늘 오후에 진행될 예정입니다.');
	form.set('status', 'PUBLISHED');
	form.set('showOnHome', 'on');
	return form;
}

describe('관리자 공지 관리', () => {
	beforeEach(() => {
		listAdminNotices.mockReset();
		createNotice.mockReset();
		updateNotice.mockReset();
	});

	it('일반 사용자의 접근을 마이페이지로 돌려보낸다', async () => {
		await expect(load({ locals: { user } } as never)).rejects.toMatchObject({
			status: 303,
			location: '/my'
		});
	});

	it('관리자에게 전체 공지를 반환한다', async () => {
		listAdminNotices.mockResolvedValue([{ id: 'notice-1' }]);
		await expect(load({ locals: { user: admin } } as never)).resolves.toEqual({
			notices: [{ id: 'notice-1' }]
		});
	});

	it('관리자가 공지를 생성한다', async () => {
		createNotice.mockResolvedValue({ id: 'notice-1' });
		const result = await actions.create!({
			locals: { user: admin },
			request: new Request('http://localhost/admin/notices', {
				method: 'POST',
				body: noticeForm()
			})
		} as never);

		expect(createNotice).toHaveBeenCalledWith(
			'postgresql://test',
			1,
			expect.objectContaining({ title: '서비스 점검 안내', showOnHome: true })
		);
		expect(result).toEqual({ success: true, message: '공지를 저장했습니다.' });
	});

	it('존재하지 않는 공지 수정은 404를 반환한다', async () => {
		updateNotice.mockResolvedValue(null);
		const result = await actions.update!({
			locals: { user: admin },
			request: new Request('http://localhost/admin/notices', {
				method: 'POST',
				body: noticeForm('missing')
			})
		} as never);

		expect(result).toMatchObject({ status: 404 });
	});
});
