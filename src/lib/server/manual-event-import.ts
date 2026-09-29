import { parseManualEventImport } from '../domain/manual-event-import';
import type { CampusSpot } from '../domain/campus-spots';
import { beginEventImportRun, finishEventImportRun, importEventProposal } from './event-candidates';

export class ManualEventImportError extends Error {}

export async function importManualEventCandidates(databaseUrl: string, text: string, spots: CampusSpot[]) {
	// 파일 전체를 검증한 후에만 DB에 기록한다. 전달된 공개 상태·이미지 승인 값은 읽지 않는다.
	const batch = parseManualEventImport(text);
	const run = await beginEventImportRun(databaseUrl, `manual:${crypto.randomUUID()}`, new Date());
	if (!run) throw new ManualEventImportError('다른 후보 저장이 진행 중입니다. 완료 후 다시 시도해 주세요.');
	const results: { sourceUrl: string; title: string; id?: string; status: 'created' | 'changed' | 'merged' | 'unchanged' | 'failed' }[] = [];
	for (const proposal of batch.candidates) {
		try {
			results.push({ sourceUrl: proposal.source.url, title: proposal.draft.title, ...await importEventProposal(databaseUrl, proposal, spots) });
		} catch {
			// 원문 파일로 다시 가져오면 이미 저장된 후보는 재사용한다. 연결 정보는 출력하지 않는다.
			results.push({ sourceUrl: proposal.source.url, title: proposal.draft.title, status: 'failed' });
		}
	}
	const newCount = results.filter((item) => item.status === 'created').length;
	const changedCount = results.filter((item) => item.status === 'changed' || item.status === 'merged').length;
	const unchangedCount = results.filter((item) => item.status === 'unchanged').length;
	const failedCount = results.filter((item) => item.status === 'failed').length;
	const status = failedCount === results.length && failedCount > 0 ? 'failed' : failedCount > 0 || batch.coverage === 'partial' ? 'partial' : 'completed';
	const message = [`신규 ${newCount}개 · 변경 ${changedCount}개 · 동일 ${unchangedCount}개`, failedCount ? `저장 실패 ${failedCount}개` : '', batch.coverage === 'partial' ? '일부 범위 확인' : '자유·홍보게시판 확인', batch.note].filter(Boolean).join(' · ');
	try {
		await finishEventImportRun(databaseUrl, run.id, {
			status, newCount, changedCount, message, checkedBoards: batch.checkedBoards,
			checkpoint: { since: batch.since.toISOString(), startedAt: batch.checkedAt.toISOString(), completedBoards: status === 'completed' ? batch.checkedBoards : [], pages: {}, retryPosts: results.filter((item) => item.status === 'failed').map((item) => item.sourceUrl) }
		});
	} catch {
		throw new ManualEventImportError('후보 저장 후 실행 기록을 마무리하지 못했습니다. 승인함을 확인하고 같은 파일로 다시 시도해 주세요.');
	}
	return { runId: run.id, status, newCount, changedCount, unchangedCount, failedCount, message, results };
}
