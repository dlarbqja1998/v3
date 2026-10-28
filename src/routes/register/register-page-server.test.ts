import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst, setValues, updateWhere } = vi.hoisted(() => ({
	findFirst: vi.fn(), setValues: vi.fn(), updateWhere: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('$lib/server/db', () => ({
	createDb: () => ({ query: { users: { findFirst } }, update: () => ({ set: setValues }) })
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
		setValues.mockReset().mockReturnValue({ where: updateWhere });
		updateWhere.mockReset().mockResolvedValue(undefined);
	});

	it.each(['대학원생', '졸업생', '교직원', '기타 외부인'])('%s 가입 시 구분을 저장하고 학번은 요구하지 않는다', async (department) => {
		findFirst.mockResolvedValue(undefined);
		const request = new Request('http://localhost/register', {
			method: 'POST',
			body: new URLSearchParams({
				nickname: '새회원', college: '그 외', department, studentYear: '', gender: 'female', next: '/my'
			})
		});
		await expect(actions.complete!({
			request, locals: { user: { id: 1 } }, url: new URL(request.url)
		} as never)).rejects.toMatchObject({ status: 303, location: '/my' });
		expect(setValues).toHaveBeenCalledWith({
			nickname: '새회원', college: '그 외', department, grade: '', gender: 'female', isOnboarded: true
		});
	});

	it('비학부생 구분 없이 완료 요청을 보내면 저장하지 않는다', async () => {
		const request = new Request('http://localhost/register', {
			method: 'POST',
			body: new URLSearchParams({ nickname: '새회원', college: '그 외', gender: 'female' })
		});
		const result = await actions.complete!({
			request, locals: { user: { id: 1 } }, url: new URL(request.url)
		} as never);
		expect(result).toMatchObject({ status: 400, data: { message: '현재 신분을 선택해 주세요.' } });
		expect(setValues).not.toHaveBeenCalled();
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

	it('F12로 외부 next 값을 넣어도 내부 기본 경로로 정규화한다', async () => {
		findFirst.mockResolvedValue(undefined);
		const request = createNicknameCheckRequest('골라바유');
		const form = await request.formData();
		form.set('next', 'https://evil.example/steal');

		const result = await actions.checkNickname!({
			request: new Request('http://localhost/register', { method: 'POST', body: form }),
			locals: { user: { id: 1 } }
		} as never);

		expect(result).toMatchObject({ next: '/' });
	});
});
