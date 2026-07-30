import { describe, expect, it } from 'vitest';
import { buildMyPageRows, getLoginMethodLabel } from './my-page';

const user = {
	id: 7,
	email: 'student@golabau.local',
	nickname: '포도',
	profileImg: null,
	isOnboarded: true,
	role: 'user',
	college: '과학기술대학',
	department: '컴퓨터소프트웨어학과',
	grade: '24학번',
	gender: 'unknown'
};

describe('마이페이지 표시 정보', () => {
	it('로그인한 사용자의 기본 정보를 읽기용 행으로 만든다', () => {
		expect(buildMyPageRows(user)).toEqual([
			{ label: '닉네임', value: '포도' },
			{ label: '단과대', value: '과학기술대학' },
			{ label: '학과', value: '컴퓨터소프트웨어학과' },
			{ label: '학번', value: '24학번' },
			{ label: '성별', value: '응답하지 않음' },
			{ label: '로그인 방식', value: '카카오 로그인' }
		]);
	});

	it('관리자 역할은 관리자 로그인으로 표시한다', () => {
		expect(getLoginMethodLabel({ ...user, role: 'admin' })).toBe('관리자 로그인');
	});
});
