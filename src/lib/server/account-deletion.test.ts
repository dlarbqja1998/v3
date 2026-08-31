import { describe, expect, it, vi } from 'vitest';
import { deleteUserAccount } from './account-deletion';

describe('회원 탈퇴 데이터 삭제', () => {
	it('문의와 사용자를 하나의 배치로 삭제하고 학식 평가는 사용자 외래키로 연쇄 삭제한다', async () => {
		const where = vi.fn(() => ({ query: true }));
		const remove = vi.fn(() => ({ where }));
		const batch = vi.fn().mockResolvedValue([]);
		await deleteUserAccount('db', 7, { delete: remove, batch } as never);
		expect(remove).toHaveBeenCalledTimes(2);
		expect(batch).toHaveBeenCalledOnce();
		expect(batch.mock.calls[0][0]).toHaveLength(2);
	});
});
