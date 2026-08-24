import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('$lib/server/db', () => ({
	createDb: () => ({ query: { users: { findFirst } } })
}));

import { actions } from './+page.server';

function createNicknameCheckRequest(nickname: string) {
	const formData = new FormData();
	formData.set('nickname', nickname);

	return new Request('http://localhost/register', { method: 'POST', body: formData });
}

describe('온보딩 닉네임 중복 확인', () => {
	beforeEach(() => {
		findFirst.mockReset();
	});

	it('이미 사용 중인 닉네임은 재입력 안내를 반환한다', async () => {
		findFirst.mockResolvedValue({ id: 99 });

		const result = await actions.checkNickname!({
			request: createNicknameCheckRequest('골라바유'),
			locals: { user: { id: 1 } }
		} as never);

		expect(result).toEqual({
			nicknameCheck: {
				nickname: '골라바유',
				status: 'duplicate',
				message: '이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해 주세요.'
			},
			values: {
				nickname: '골라바유',
				college: '',
				department: '',
				studentYear: '',
				gender: ''
			},
			next: '/'
		});
	});

	it('사용 가능한 닉네임은 다음 단계로 진행할 수 있는 결과를 반환한다', async () => {
		findFirst.mockResolvedValue(undefined);

		const result = await actions.checkNickname!({
			request: createNicknameCheckRequest('골라바유'),
			locals: { user: { id: 1 } }
		} as never);

		expect(result).toEqual({
			nicknameCheck: {
				nickname: '골라바유',
				status: 'available',
				message: '사용 가능한 닉네임입니다.'
			},
			values: {
				nickname: '골라바유',
				college: '',
				department: '',
				studentYear: '',
				gender: ''
			},
			next: '/'
		});
	});

	it('중복 조회에 실패하면 다시 시도할 수 있도록 안내한다', async () => {
		findFirst.mockRejectedValue(new Error('데이터베이스 오류'));

		await expect(
			actions.checkNickname!({
				request: createNicknameCheckRequest('골라바유'),
				locals: { user: { id: 1 } }
			} as never)
		).resolves.toMatchObject({
			status: 500,
			data: {
				nicknameCheck: {
					nickname: '골라바유',
					status: 'error',
					message: '중복 확인에 실패했어요. 다시 시도해 주세요.'
				},
				values: {
					nickname: '골라바유',
					college: '',
					department: '',
					studentYear: '',
					gender: ''
				},
				next: '/'
			}
		});
	});

	it('중복 확인과 가입 완료를 각각 명명 액션으로 제공한다', () => {
		expect(actions.checkNickname).toBeTypeOf('function');
		expect(actions.complete).toBeTypeOf('function');
		expect(actions.default).toBeUndefined();
	});
});
