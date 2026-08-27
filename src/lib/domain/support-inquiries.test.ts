import { describe, expect, it } from 'vitest';
import {
	inquiryCategories,
	normalizeInquiryAnswer,
	normalizeInquiryInput
} from './support-inquiries';

describe('문의 도메인', () => {
	it('고정 문의 유형과 길이를 통과한 입력을 정규화한다', () => {
		const form = new FormData();
		form.set('category', 'SERVICE_ERROR');
		form.set('title', '지도가 열리지 않아요');
		form.set('content', '핀 수정 화면에서 지도가 계속 빈 화면으로 나옵니다.');

		expect(normalizeInquiryInput(form)).toEqual({
			ok: true,
			value: {
				category: 'SERVICE_ERROR',
				title: '지도가 열리지 않아요',
				content: '핀 수정 화면에서 지도가 계속 빈 화면으로 나옵니다.'
			}
		});
	});

	it('정의되지 않은 문의 유형을 거부한다', () => {
		const form = new FormData();
		form.set('category', 'UNKNOWN');
		form.set('title', '문의 제목입니다');
		form.set('content', '문의 내용은 열 글자보다 길게 작성했습니다.');

		expect(normalizeInquiryInput(form)).toEqual({
			ok: false,
			message: '문의 유형, 제목, 내용을 확인해 주세요.'
		});
	});

	it('빈 관리자 답변을 거부하고 공백을 정리한다', () => {
		const form = new FormData();
		form.set('answer', ' ');
		expect(normalizeInquiryAnswer(form)).toEqual({
			ok: false,
			message: '답변을 2자 이상 입력해 주세요.'
		});

		form.set('answer', '  네, 확인했습니다.  ');
		expect(normalizeInquiryAnswer(form)).toEqual({
			ok: true,
			value: { answer: '네, 확인했습니다.' }
		});
	});

	it('문의 유형 목록을 사용자 문구와 함께 고정한다', () => {
		expect(inquiryCategories).toEqual([
			{ value: 'SERVICE_ERROR', label: '서비스 오류' },
			{ value: 'INFORMATION_UPDATE', label: '정보 수정 요청' },
			{ value: 'USAGE', label: '이용 문의' },
			{ value: 'OTHER', label: '기타' }
		]);
	});
});
