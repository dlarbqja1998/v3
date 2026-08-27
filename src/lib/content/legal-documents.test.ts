import { describe, expect, it } from 'vitest';
import { privacyPolicy, termsOfService } from './legal-documents';

describe('서비스 법적 문서', () => {
	it('운영 주체와 문의 이메일을 공개한다', () => {
		const text = JSON.stringify([privacyPolicy, termsOfService]);
		expect(text).toContain('골라바유 운영팀');
		expect(text).toContain('dlarbqja1998@korea.ac.kr');
	});
	it('버전과 시행일을 가진다', () => {
		for (const document of [privacyPolicy, termsOfService]) {
			expect(document.version).toMatch(/^\d+\.\d+$/);
			expect(document.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
	});
});
