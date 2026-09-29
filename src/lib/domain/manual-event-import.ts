import { EVENT_SOURCE_BOARDS, parseEventProposal, type EventProposal } from './event-candidates';

export const MANUAL_EVENT_IMPORT_LIMIT = 30;
export const MANUAL_EVENT_IMPORT_MAX_BYTES = 1024 * 1024;

export type ManualEventImport = {
	since: Date;
	checkedAt: Date;
	checkedBoards: string[];
	coverage: 'complete' | 'partial';
	note: string;
	candidates: EventProposal[];
};

/** 사람이 요청한 확인 결과만 가져온다. 이 모듈은 출처를 읽거나 AI를 호출하지 않는다. */
export function parseManualEventImport(text: string, now = new Date()): ManualEventImport {
	if (new TextEncoder().encode(text).byteLength > MANUAL_EVENT_IMPORT_MAX_BYTES) throw new Error('확인 결과 파일은 1MB 이하여야 합니다.');
	let input: unknown;
	try { input = JSON.parse(text.replace(/^\uFEFF/, '')); }
	catch { throw new Error('확인 결과 파일의 JSON 형식을 확인해 주세요.'); }
	if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('확인 결과 형식이 올바르지 않습니다.');
	const data = input as Record<string, unknown>;
	if (data.schemaVersion !== 1) throw new Error('확인 결과의 schemaVersion은 1이어야 합니다.');
	if (typeof data.checkedAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(data.checkedAt)) throw new Error('실제 확인 시각과 시간대가 필요합니다.');
	const checkedAt = new Date(data.checkedAt);
	if (!Number.isFinite(checkedAt.getTime()) || checkedAt.getTime() > now.getTime() + 5 * 60_000) throw new Error('실제 확인 시각을 확인해 주세요.');
	if (typeof data.since !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(data.since)) throw new Error('확인한 기간의 시작 시각과 시간대가 필요합니다.');
	const since = new Date(data.since);
	if (!Number.isFinite(since.getTime()) || since > checkedAt) throw new Error('확인한 기간을 확인해 주세요.');
	const boardIds: string[] = EVENT_SOURCE_BOARDS.map((board) => board.id);
	if (!Array.isArray(data.checkedBoards) || data.checkedBoards.length === 0 || data.checkedBoards.some((id) => typeof id !== 'string' || !boardIds.includes(id))) throw new Error('실제로 확인한 자유·홍보게시판을 지정해 주세요.');
	const checkedBoards = [...new Set(data.checkedBoards as string[])];
	if (data.coverage !== 'complete' && data.coverage !== 'partial') throw new Error('확인 범위를 complete 또는 partial로 지정해 주세요.');
	if (data.coverage === 'complete' && checkedBoards.length !== boardIds.length) throw new Error('두 게시판을 모두 확인해야 전체 확인으로 기록할 수 있습니다.');
	const note = typeof data.note === 'string' ? data.note.trim() : '';
	if (note.length > 500) throw new Error('확인 메모는 500자 이하여야 합니다.');
	if (data.coverage === 'partial' && !note) throw new Error('일부만 확인한 이유를 메모에 남겨 주세요.');
	if (!Array.isArray(data.candidates) || data.candidates.length > MANUAL_EVENT_IMPORT_LIMIT) throw new Error(`한 번에 후보를 최대 ${MANUAL_EVENT_IMPORT_LIMIT}개까지 저장할 수 있습니다.`);
	const identities = new Set<string>();
	const candidates = data.candidates.map((value, index) => {
		try {
			const proposal = parseEventProposal(value, checkedAt);
			const boardId = new URL(proposal.source.url).pathname.split('/')[1];
			if (!checkedBoards.includes(boardId)) throw new Error('확인한 게시판 목록에 없는 출처입니다.');
			if (!proposal.source.title || !proposal.source.evidence) throw new Error('원문 제목과 행사 판단 근거가 필요합니다.');
			const identity = `${proposal.source.url}#${proposal.draft.title}`;
			if (identities.has(identity)) throw new Error('같은 출처의 같은 행사가 파일에 중복되어 있습니다.');
			identities.add(identity);
			return proposal;
		} catch (caught) {
			throw new Error(`${index + 1}번째 후보: ${caught instanceof Error ? caught.message : '입력 내용을 확인해 주세요.'}`);
		}
	});
	return { since, checkedAt, checkedBoards, coverage: data.coverage, note, candidates };
}
