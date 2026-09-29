import type { EventCandidateRow } from './event-candidates';
import { emptyCandidateDraft, getCandidateIssues } from '../domain/event-candidates';

export function eventCandidateFixture(overrides: Partial<EventCandidateRow> = {}): EventCandidateRow {
	return {
		id: '10000000-0000-4000-8000-000000000001', dedupKey: null,
		draft: { ...emptyCandidateDraft(), title: '학생 문화제 · 예시', organizer: '학생 기획단', category: '공연', description: '승인함 동작 확인을 위한 예시 행사입니다.', startsAt: '2026-09-23T03:00:00.000Z', endsAt: '2026-09-23T05:00:00.000Z', locationName: '학생회관 앞', latitude: 36.6095, longitude: 127.287, location: { type: 'pin' } },
		suggestedDraft: null, sources: [{ url: 'https://everytime.kr/370457/v/1', title: '학생 문화제 안내 · 예시', board: '자유게시판', evidence: '화면 검증을 위한 가상 데이터입니다.', observedAt: '2026-09-20T00:00:00.000Z' }],
		state: 'pending', version: 1,
		coverImage: { id: '20000000-0000-4000-8000-000000000001', objectKey: 'event-candidates/preview/poster.png', contentType: 'image/png', byteSize: 100 },
		coverApproved: true, reviewFlags: [], manuallyEdited: false, publishedEventId: null, publishedAt: null, reviewedBy: null,
		createdAt: new Date('2026-09-20T00:00:00Z'), updatedAt: new Date('2026-09-20T00:00:00Z'), ...overrides
	};
}

export function eventInboxPreview() {
	const first = eventCandidateFixture();
	const second = eventCandidateFixture({ id: '10000000-0000-4000-8000-000000000002', draft: { ...first.draft, title: '진로 탐색 특강 · 예시', category: '강연', locationName: '농심국제관', startsAt: '2026-09-24T06:00:00Z', endsAt: '2026-09-24T08:00:00Z' }, sources: [{ ...first.sources[0], board: '홍보게시판', title: '진로 특강 안내 · 예시' }] });
	const third = eventCandidateFixture({ id: '10000000-0000-4000-8000-000000000003', draft: { ...first.draft, title: '개강 체험 행사 · 예시', endsAt: null, latitude: null, longitude: null, locationName: '미래관 사거리', location: null }, coverImage: null, coverApproved: false });
	return { available: true, candidates: [first, second, third].map((candidate) => ({ ...candidate, issues: getCandidateIssues(candidate) })), runs: [] };
}
