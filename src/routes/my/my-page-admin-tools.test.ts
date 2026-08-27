import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';

import MyPage from './+page.svelte';

function renderMyPage(role: 'admin' | 'user') {
	const data = {
		user: {
			id: role === 'admin' ? 1 : 2,
			email: `${role}@example.com`,
			nickname: role === 'admin' ? '관리자' : '사용자',
			profileImg: null,
			isOnboarded: true,
			role,
			college: null,
			department: null,
			grade: null,
			gender: null
		},
		rows: []
	};

	return render(MyPage, { props: { data } as never }).body;
}

describe('마이페이지 관리자 도구', () => {
	it('관리자에게 온보딩 미리보기 진입 버튼을 보여준다', () => {
		const body = renderMyPage('admin');

		expect(body).toContain('온보딩 미리보기');
		expect(body).toContain('href="/admin/onboarding-preview"');
	});

	it('관리자에게 별도 핀 에디터 진입 버튼을 보여준다', () => {
		const body = renderMyPage('admin');

		expect(body).toContain('핀 수정하기');
		expect(body).toContain('href="/admin/pin-editor"');
	});

	it('일반 사용자에게 온보딩 미리보기 진입 버튼을 숨긴다', () => {
		const body = renderMyPage('user');

		expect(body).not.toContain('온보딩 미리보기');
		expect(body).not.toContain('href="/admin/onboarding-preview"');
		expect(body).not.toContain('href="/admin/pin-editor"');
	});
});
