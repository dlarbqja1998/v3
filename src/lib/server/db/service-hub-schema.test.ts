import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { notices, supportInquiries } from './schema';

describe('마이페이지 서비스 허브 DB 스키마', () => {
	it('공지와 문의 테이블 이름을 고정한다', () => {
		expect(getTableConfig(notices).name).toBe('notices');
		expect(getTableConfig(supportInquiries).name).toBe('support_inquiries');
	});

	it('공지 게시 상태와 메인 노출 필드를 제공한다', () => {
		const columns = getTableConfig(notices).columns.map((column) => column.name);
		expect(columns).toEqual(
			expect.arrayContaining(['status', 'is_pinned', 'show_on_home', 'published_at'])
		);
	});

	it('문의 단일 답변과 읽음 필드를 제공한다', () => {
		const columns = getTableConfig(supportInquiries).columns.map((column) => column.name);
		expect(columns).toEqual(
			expect.arrayContaining([
				'user_id',
				'answer',
				'answered_by',
				'answered_at',
				'answer_updated_at',
				'answer_read_at'
			])
		);
	});
});
