import { beforeEach, describe, expect, it, vi } from 'vitest';
import { answerInquiry, createInquiry, getUserInquiry, listUserInquiries } from './support-inquiries';

const { findMany, findFirst, insertValues, insertReturning, updateSet, updateWhere, updateReturning } = vi.hoisted(() => ({
	findMany: vi.fn(), findFirst: vi.fn(), insertValues: vi.fn(), insertReturning: vi.fn(),
	updateSet: vi.fn(), updateWhere: vi.fn(), updateReturning: vi.fn()
}));

const db = {
	query: { supportInquiries: { findMany, findFirst } },
	insert: vi.fn(() => ({ values: insertValues })),
	update: vi.fn(() => ({ set: updateSet }))
};

describe('문의 저장소', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		insertValues.mockReturnValue({ returning: insertReturning });
		updateSet.mockReturnValue({ where: updateWhere });
		updateWhere.mockReturnValue({ returning: updateReturning });
	});

	it('한 시간에 이미 3건이면 문의 생성을 거부한다', async () => {
		findMany.mockResolvedValue([{ id: '1' }, { id: '2' }, { id: '3' }]);
		await expect(createInquiry('db', 7, { category: 'OTHER', title: '문의 제목', content: '문의 내용 열 글자 이상' }, db as never)).resolves.toEqual({ ok: false, reason: 'RATE_LIMIT' });
		expect(db.insert).not.toHaveBeenCalled();
	});

	it('사용자 문의 목록과 상세는 사용자 조건으로 조회한다', async () => {
		findMany.mockResolvedValue([]);
		findFirst.mockResolvedValue(undefined);
		await listUserInquiries('db', 7, db as never);
		await expect(getUserInquiry('db', 7, 'q1', db as never)).resolves.toBeNull();
		expect(findMany).toHaveBeenCalledOnce();
		expect(findFirst).toHaveBeenCalledOnce();
	});

	it('관리자 답변은 단일 답변과 상태·시각을 갱신한다', async () => {
		updateReturning.mockResolvedValue([{ id: 'q1', status: 'ANSWERED' }]);
		const now = new Date('2026-08-28T00:00:00Z');
		await expect(answerInquiry('db', 'q1', 1, '답변입니다.', db as never, now)).resolves.toEqual({ id: 'q1', status: 'ANSWERED' });
		expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ answer: '답변입니다.', answeredBy: 1, status: 'ANSWERED', answeredAt: now, answerUpdatedAt: now, updatedAt: now }));
	});
});
