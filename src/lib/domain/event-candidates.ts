import { EVENT_CATEGORIES, normalizeCampusEventInput, type CampusEventCategory } from './campus-events';
import type { CampusSpot } from './campus-spots';
import { parseCampusEventLocation, type CampusEventLocation } from './event-locations';

export const EVENT_SOURCE_BOARDS = [
	{ id: '370457', name: '자유게시판', url: 'https://everytime.kr/370457' },
	{ id: '367439', name: '홍보게시판', url: 'https://everytime.kr/367439' }
] as const;
export const EVENT_CANDIDATE_BATCH_LIMIT = 10;

export type EventCandidateDraft = {
	title: string;
	category: CampusEventCategory;
	organizer: string;
	description: string;
	startsAt: string | null;
	endsAt: string | null;
	locationName: string;
	latitude: number | null;
	longitude: number | null;
	location: CampusEventLocation | null;
	externalUrl: string | null;
};
export type CandidateCover = { id: string; objectKey: string; contentType: 'image/png' | 'image/jpeg' | 'image/webp'; byteSize: number };
export type CandidateSource = {
	url: string;
	title: string;
	board: string;
	evidence: string;
	observedAt: string;
	contentHash?: string;
};
export type EventProposal = {
	draft: EventCandidateDraft;
	source: CandidateSource;
	missing: string[];
	isCancellation: boolean;
	posterIndex: number | null;
};
export type CandidateState = 'pending' | 'published' | 'rejected';
export type CollectionRunStatus = 'running' | 'completed' | 'partial' | 'failed' | 'needs_login';
export type EventCollectionCheckpoint = {
	since: string;
	startedAt: string;
	completedBoards: string[];
	pages: Record<string, { url: string; seenPosts: string[] }>;
	retryPosts: string[];
};

export function isEventSourceUrl(value: unknown, detailOnly = false): value is string {
	if (typeof value !== 'string') return false;
	try {
		const url = new URL(value);
		return url.origin === 'https://everytime.kr' && !url.username && !url.password && !url.search &&
			(detailOnly ? /^\/(370457|367439)\/v\/\d+$/.test(url.pathname) : /^\/(370457|367439)(?:\/v\/\d+|\/p\/\d+)?$/.test(url.pathname));
	} catch { return false; }
}

export function emptyCandidateDraft(): EventCandidateDraft {
	return { title: '', category: '기타', organizer: '', description: '', startsAt: null, endsAt: null, locationName: '', latitude: null, longitude: null, location: null, externalUrl: null };
}

function cleanString(value: unknown, max: number) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function dateOrNull(value: unknown) {
	if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
	const date = new Date(value);
	return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
function linkOrNull(value: unknown) {
	if (typeof value !== 'string' || value.length > 2048) return null;
	try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}

/** 모델 출력의 좌표는 채택하지 않는다. 일치하는 교내 지점이나 관리자가 위치를 확정한다. */
export function parseEventProposal(value: unknown, observedAt = new Date()): EventProposal {
	if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('행사 후보 형식이 올바르지 않습니다.');
	const data = value as Record<string, unknown>;
	if (!isEventSourceUrl(data.sourceUrl, true)) throw new Error('확인한 게시글 주소가 필요합니다.');
	const title = cleanString(data.title, 120);
	if (title.length < 2) throw new Error('행사명을 확인해 주세요.');
	return {
		draft: {
			...emptyCandidateDraft(), title,
			category: EVENT_CATEGORIES.includes(data.category as CampusEventCategory) ? data.category as CampusEventCategory : '기타',
			organizer: cleanString(data.organizer, 120), description: cleanString(data.description, 10000),
			startsAt: dateOrNull(data.startsAt), endsAt: dateOrNull(data.endsAt),
			locationName: cleanString(data.locationName, 160), externalUrl: linkOrNull(data.externalUrl)
		},
		source: { url: data.sourceUrl, title: cleanString(data.sourceTitle, 300), board: EVENT_SOURCE_BOARDS.find((board) => new URL(data.sourceUrl as string).pathname.startsWith(`/${board.id}/`))!.name, evidence: cleanString(data.evidence, 2500), observedAt: observedAt.toISOString() },
		missing: Array.isArray(data.missing) ? data.missing.filter((item): item is string => typeof item === 'string').slice(0, 15).map((item) => item.slice(0, 160)) : [],
		isCancellation: data.isCancellation === true,
		posterIndex: Number.isInteger(data.posterIndex) && Number(data.posterIndex) >= 0 && Number(data.posterIndex) < 6 ? Number(data.posterIndex) : null
	};
}

export function candidateIdentity(title: string) {
	return title.normalize('NFKC').replace(/\bD\s*-\s*\d+\b/gi, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
}

export function candidateDedupKey(draft: EventCandidateDraft) {
	if (!draft.startsAt || draft.organizer.length < 2) return null;
	return [candidateIdentity(draft.title), candidateIdentity(draft.organizer), draft.startsAt].join('|');
}

export function matchCandidateLocation(draft: EventCandidateDraft, spots: CampusSpot[]): EventCandidateDraft {
	if (draft.latitude !== null && draft.longitude !== null) return draft;
	const matches = spots.filter((spot) => spot.name.trim() === draft.locationName.trim());
	if (matches.length !== 1) return draft;
	const spot = matches[0];
	return { ...draft, latitude: spot.center.latitude, longitude: spot.center.longitude, location: spot.type === 'building' ? { type: 'building', buildingIds: [spot.id] } : { type: 'pin' } };
}

export function candidateToFormData(draft: EventCandidateDraft) {
	const form = new FormData();
	for (const [key, value] of Object.entries(draft)) form.set(key, key === 'location' ? value ? JSON.stringify(value) : '' : value === null ? '' : String(value));
	form.set('isVisible', 'on');
	return form;
}

export function getCandidateIssues(candidate: { draft: EventCandidateDraft; coverImage: CandidateCover | null; coverApproved: boolean; reviewFlags: string[] }, spots?: CampusSpot[]) {
	const { draft } = candidate;
	const issues = [...candidate.reviewFlags];
	if (draft.title.length < 2) issues.push('행사명 확인');
	if (draft.organizer.length < 2) issues.push('주최 확인');
	if (draft.description.length < 5) issues.push('설명 확인');
	if (!draft.startsAt) issues.push('시작 일시 확인');
	if (!draft.endsAt) issues.push('종료 일시 확인');
	if (draft.startsAt && draft.endsAt && new Date(draft.endsAt) <= new Date(draft.startsAt)) issues.push('종료 일시가 시작보다 늦어야 함');
	if (!draft.locationName) issues.push('장소 확인');
	if (draft.latitude === null || draft.longitude === null) issues.push('지도 위치 확인');
	if (!candidate.coverImage) issues.push('대표 이미지 필요');
	else if (!candidate.coverApproved) issues.push('대표 이미지 사용 확인');
	if (spots && issues.length === 0) {
		const validation = normalizeCampusEventInput(candidateToFormData(draft), { coverImageCount: 1, campusSpots: spots });
		if (!validation.ok) issues.push(validation.message);
	}
	return [...new Set(issues)];
}

/** datetime-local 입력은 실행 서버의 시간대와 무관하게 한국 시간으로 해석한다. */
export function parseCandidateEdit(form: FormData): EventCandidateDraft {
	const draft = emptyCandidateDraft();
	for (const key of ['title', 'organizer', 'description', 'locationName'] as const) draft[key] = String(form.get(key) ?? '').trim();
	if (draft.title.length > 120 || draft.organizer.length > 120 || draft.description.length > 10000 || draft.locationName.length > 160) throw new Error('입력한 내용의 길이를 확인해 주세요.');
	const category = String(form.get('category') ?? '');
	if (!EVENT_CATEGORIES.includes(category as CampusEventCategory)) throw new Error('행사 분류를 선택해 주세요.');
	draft.category = category as CampusEventCategory;
	for (const key of ['startsAt', 'endsAt'] as const) {
		const raw = String(form.get(key) ?? '');
		draft[key] = raw ? dateOrNull(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) ? `${raw}:00+09:00` : raw) : null;
		if (raw && !draft[key]) throw new Error('행사 일시를 확인해 주세요.');
	}
	for (const key of ['latitude', 'longitude'] as const) {
		const raw = String(form.get(key) ?? '').trim();
		draft[key] = raw && Number.isFinite(Number(raw)) ? Number(raw) : null;
	}
	const rawLocation = String(form.get('location') ?? '');
	try { draft.location = rawLocation ? parseCampusEventLocation(JSON.parse(rawLocation)) : null; } catch { throw new Error('지도 위치를 다시 지정해 주세요.'); }
	const rawLink = String(form.get('externalUrl') ?? '').trim();
	draft.externalUrl = linkOrNull(rawLink);
	if (rawLink && !draft.externalUrl) throw new Error('안내 링크 주소를 확인해 주세요.');
	return draft;
}

export function getCollectionWindow(lastSuccess: Date | null, now: Date) {
	return { since: new Date(lastSuccess ? lastSuccess.getTime() - 48 * 60 * 60 * 1000 : now.getTime() - 14 * 24 * 60 * 60 * 1000), until: now };
}
