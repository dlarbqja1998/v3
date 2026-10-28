import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findFirst, setValues, updateWhere } = vi.hoisted(() => ({
	findFirst: vi.fn(),
	setValues: vi.fn(),
	updateWhere: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgresql://test' } }));
vi.mock('$lib/server/db', () => ({
	createDb: () => ({
		query: { users: { findFirst } },
		update: () => ({ set: setValues })
	})
}));

import { actions, load } from './+page.server';

const savedUser = {
	id: 1,
	nickname: '참살이',
	college: '과학기술대학',
	department: '스마트에코시티 융합전공',
	grade: '21학번',
	gender: 'unknown'
};

function createRequest(college = savedUser.college, department = savedUser.department) {
	return new Request('http://localhost/my/edit', {
		method: 'POST',
		body: new URLSearchParams({
			nickname: '새닉네임',
			college,
			department,
			studentYear: savedUser.grade,
			gender: savedUser.gender
		})
	});
}

describe('학과 목록 변경 후 내 정보 수정', () => {
	beforeEach(() => {
		findFirst.mockReset().mockResolvedValue(undefined);
		updateWhere.mockReset().mockResolvedValue(undefined);
		setValues.mockReset().mockReturnValue({ where: updateWhere });
	});

	it('저장된 학과명 오타를 수정 화면의 현재 선택값으로 정정한다', async () => {
		const result = await load({
			locals: { user: { ...savedUser, college: '문화스포츠대학', department: '국제스포츠학부 문화유산융합학부' } }
		} as never);

		expect(result).toMatchObject({ values: { college: '문화스포츠대학', department: '문화유산융합학부' } });
		expect(setValues).not.toHaveBeenCalled();
	});

	it('비학부생 회원의 신분을 불러오고 학번 없이 수정 내용을 저장한다', async () => {
		const user = { ...savedUser, college: '그 외', department: '대학원생', grade: '' };
		await expect(load({ locals: { user } } as never)).resolves.toMatchObject({
			values: { college: '그 외', department: '대학원생', studentYear: '' }
		});
		await expect(actions.default!({
			request: createRequest('그 외', '대학원생'), locals: { user }
		} as never)).rejects.toMatchObject({ status: 303, location: '/my' });
		expect(setValues).toHaveBeenCalledWith(expect.objectContaining({
			college: '그 외', department: '대학원생', grade: ''
		}));
	});

	it.each([
		{ college: '취창업지원센터(관)', department: '취창업지원센터' },
		{ college: '과학기술대학', department: '스마트에코시티 융합전공' },
		{ college: '과학기술대학', department: '첨단반도체공정장비 융합전공' },
		{ college: '문화스포츠대학', department: '국제스포츠학부' }
	])('기존 $department 소속을 유지한 채 닉네임만 바꿔도 저장할 수 있다', async (affiliation) => {
		const user = { ...savedUser, ...affiliation };
		const loaded = await load({ locals: { user } } as never);
		expect(loaded).toMatchObject({ values: affiliation });
		expect(setValues).not.toHaveBeenCalled();

		await expect(actions.default!({
			request: createRequest(user.college, user.department), locals: { user }
		} as never)).rejects.toMatchObject({ status: 303, location: '/my' });

		expect(setValues).toHaveBeenCalledWith(expect.objectContaining({
			nickname: '새닉네임', college: user.college, department: user.department
		}));
	});

	it('다른 회원이 삭제된 선택지를 직접 제출해도 기존 소속으로 인정하지 않는다', async () => {
		const result = await actions.default!({
			request: createRequest(),
			locals: { user: { ...savedUser, department: '컴퓨터소프트웨어학과' } }
		} as never);

		expect(result).toMatchObject({ status: 400, data: { message: '학부·학과/전공을 선택해 주세요.' } });
		expect(setValues).not.toHaveBeenCalled();
	});
});
