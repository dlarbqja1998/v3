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
		rows: [],
		appVersion: '0.0.1',
		unreadInquiryCount: 2
	};

	return render(MyPage, { props: { data } as never }).body;
}

describe('마이페이지 관리자 도구', () => {
	it('프로필 아래에 서비스·서비스 정보·계정 관리 섹션을 보여준다', () => {
		const body = renderMyPage('user');
		expect(body).toContain('프로필');
		expect(body).toContain('공지사항');
		expect(body).toContain('문의하기');
		expect(body).toContain('서비스 정보');
		expect(body).toContain('이용약관');
		expect(body).toContain('개인정보 처리방침');
		expect(body).toContain('앱 버전');
		expect(body).toContain('계정 관리');
		expect(body).toContain('회원 탈퇴');
	});

	it('섹션 제목과 들여쓴 하위 메뉴를 서로 다른 위계로 렌더링한다', () => {
		const body = renderMyPage('user');
		expect(body.match(/data-section-heading/g)).toHaveLength(4);
		expect(body).toContain('data-menu-row');
		expect(body).toContain('pl-3');
		expect(body).toContain('border-b border-brand-border pb-3');
	});
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

	it('관리자에게 공지와 문의 관리 진입을 보여준다', () => {
		const body = renderMyPage('admin');
		expect(body).toContain('공지 관리');
		expect(body).toContain('문의 관리');
	});

	it('관리자에게 행사 관리 진입을 보여준다', () => {
		const body = renderMyPage('admin');
		expect(body).toContain('행사 관리');
		expect(body).toContain('href="/admin/events"');
	});

	it('일반 사용자에게 온보딩 미리보기 진입 버튼을 숨긴다', () => {
		const body = renderMyPage('user');

		expect(body).not.toContain('온보딩 미리보기');
		expect(body).not.toContain('href="/admin/onboarding-preview"');
		expect(body).not.toContain('href="/admin/pin-editor"');
		expect(body).not.toContain('href="/admin/events"');
	});
});
