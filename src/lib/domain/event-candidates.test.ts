import { describe, expect, it } from 'vitest';
import { candidateDedupKey, emptyCandidateDraft, getCandidateIssues, getCollectionWindow, isEventSourceUrl, matchCandidateLocation, parseCandidateEdit, parseEventProposal } from './event-candidates';
import { eventCandidateFixture } from '../server/event-candidate-fixtures';
import type { CampusSpot } from './campus-spots';

describe('행사 후보 추출·보완', () => {
	it('없는 종료 시각과 모델이 만든 좌표를 그대로 채택하지 않는다', () => {
		const proposal = parseEventProposal({ sourceUrl: 'https://everytime.kr/370457/v/123', title: '교내 강연', startsAt: '2026-09-21T11:00:00+09:00', endsAt: '2026-09-21', latitude: 36.5, longitude: 127.2 });
		expect(proposal.draft).toMatchObject({ endsAt: null, latitude: null, longitude: null, startsAt: '2026-09-21T02:00:00.000Z' });
	});
	it.each(['https://evil.test/370457/v/1', 'https://everytime.kr.evil.test/370457/v/1', 'https://user:pass@everytime.kr/370457/v/1', 'https://everytime.kr/message', 'http://everytime.kr/370457/v/1', 'https://everytime.kr/370457/v/1?next=evil'])('수집 범위 밖 주소를 거부한다: %s', (url) => expect(isEventSourceUrl(url)).toBe(false));
	it('미래관 사거리를 미래관으로 추정해 연결하지 않는다', () => {
		const spot = { id: 'building-mirae', name: '미래관', type: 'building', center: { latitude: 36.6, longitude: 127.2 } } as CampusSpot;
		expect(matchCandidateLocation({ ...emptyCandidateDraft(), locationName: '미래관 사거리' }, [spot]).latitude).toBeNull();
		expect(matchCandidateLocation({ ...emptyCandidateDraft(), locationName: '미래관' }, [spot]).location).toEqual({ type: 'building', buildingIds: ['building-mirae'] });
	});
	it('행사명이 같아도 회차가 다르면 중복으로 합치지 않는다', () => {
		const draft = eventCandidateFixture().draft;
		expect(candidateDedupKey(draft)).not.toBe(candidateDedupKey({ ...draft, startsAt: '2026-10-23T03:00:00Z' }));
		expect(candidateDedupKey({ ...draft, startsAt: null })).toBeNull();
	});
	it('대표 이미지와 사용 확인이 있어야 게시 가능하다', () => {
		const candidate = eventCandidateFixture();
		expect(getCandidateIssues(candidate, [])).toEqual([]);
		expect(getCandidateIssues({ ...candidate, coverApproved: false })).toContain('대표 이미지 사용 확인');
		expect(getCandidateIssues({ ...candidate, coverImage: null })).toContain('대표 이미지 필요');
	});
	it('관리자가 입력한 지역 시간을 한국 시간으로 해석한다', () => {
		const form = new FormData(); form.set('category', '강연'); form.set('startsAt', '2026-09-21T11:30');
		expect(parseCandidateEdit(form).startsAt).toBe('2026-09-21T02:30:00.000Z');
	});
	it('초기 14일과 마지막 성공 전 48시간을 다시 확인한다', () => {
		const now = new Date('2026-09-20T00:00:00Z');
		expect(getCollectionWindow(null, now).since.toISOString()).toBe('2026-09-06T00:00:00.000Z');
		expect(getCollectionWindow(new Date('2026-09-19T00:00:00Z'), now).since.toISOString()).toBe('2026-09-17T00:00:00.000Z');
	});
});
