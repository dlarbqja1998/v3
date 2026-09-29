import { describe, expect, it } from 'vitest';
import { parseManualEventImport, MANUAL_EVENT_IMPORT_MAX_BYTES } from './manual-event-import';

const now = new Date('2026-09-20T09:00:00Z');
const candidate = { sourceUrl: 'https://everytime.kr/370457/v/123', sourceTitle: '교내 공연 안내', title: '교내 공연', evidence: '학생회관 앞에서 9월 23일 오후 공연 진행', latitude: 36.6, longitude: 127.2, state: 'published', coverApproved: true };
function payload(overrides = {}) { return JSON.stringify({ schemaVersion: 1, since: '2026-09-06T00:00:00Z', checkedAt: now.toISOString(), checkedBoards: ['370457', '367439'], coverage: 'complete', candidates: [candidate], ...overrides }); }

describe('요청으로 확인한 행사 결과 검증', () => {
	it('누락 일시는 비워 두고 임의 좌표·공개·승인 값은 채택하지 않는다', () => {
		const result = parseManualEventImport(payload(), now);
		expect(result.candidates[0].draft).toMatchObject({ startsAt: null, endsAt: null, latitude: null, longitude: null });
		expect(result.candidates[0]).not.toHaveProperty('state');
		expect(result.candidates[0]).not.toHaveProperty('coverApproved');
		expect(result.candidates[0].source.observedAt).toBe(now.toISOString());
	});
	it.each(['https://everytime.kr/message', 'https://evil.test/370457/v/123', 'https://everytime.kr/370457'])('게시글 밖 주소를 거부한다: %s', (sourceUrl) => {
		expect(() => parseManualEventImport(payload({ candidates: [{ ...candidate, sourceUrl }] }), now)).toThrow('게시글 주소');
	});
	it('근거가 없거나 확인하지 않은 게시판의 후보는 저장 대상으로 삼지 않는다', () => {
		expect(() => parseManualEventImport(payload({ candidates: [{ ...candidate, evidence: '' }] }), now)).toThrow('판단 근거');
		expect(() => parseManualEventImport(payload({ checkedBoards: ['367439'], coverage: 'partial', note: '홍보만 확인' }), now)).toThrow('확인한 게시판 목록');
	});
	it('한 게시판만 확인한 결과를 전체 확인으로 표시하지 않는다', () => {
		expect(() => parseManualEventImport(payload({ checkedBoards: ['370457'] }), now)).toThrow('두 게시판');
		expect(() => parseManualEventImport(payload({ coverage: 'partial' }), now)).toThrow('이유');
		expect(parseManualEventImport(payload({ checkedBoards: ['370457'], coverage: 'partial', note: '홍보게시판 미확인' }), now).coverage).toBe('partial');
	});
	it('실제 확인 시각이 없거나 미래인 결과는 거부한다', () => {
		for (const checkedAt of ['2026-09-20T18:00:00', '틀린 날짜Z', '2026-09-22T18:00:00+09:00']) expect(() => parseManualEventImport(payload({ checkedAt }), now)).toThrow('확인 시각');
		expect(() => parseManualEventImport(payload({ since: '2026-09-21T00:00:00Z' }), now)).toThrow('확인한 기간');
	});
	it('파일 크기·후보 수·중복 항목을 제한한다', () => {
		expect(() => parseManualEventImport(' '.repeat(MANUAL_EVENT_IMPORT_MAX_BYTES + 1), now)).toThrow('1MB');
		expect(() => parseManualEventImport(payload({ candidates: Array(31).fill(candidate) }), now)).toThrow('30개');
		expect(() => parseManualEventImport(payload({ candidates: [candidate, candidate] }), now)).toThrow('중복');
	});
	it('전체 확인 결과에 후보가 없어도 정상적인 0건으로 기록할 수 있다', () => {
		expect(parseManualEventImport(payload({ candidates: [] }), now).candidates).toEqual([]);
	});
});
