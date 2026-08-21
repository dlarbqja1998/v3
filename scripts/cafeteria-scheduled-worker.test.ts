import { describe, expect, it } from 'vitest';

import { addCafeteriaScheduledHandler } from './cafeteria-scheduled-worker';

describe('학식 Cron Worker 확장', () => {
	it('SvelteKit Cloudflare Worker에 월요일 학식 캐시 갱신 scheduled 핸들러를 추가한다', () => {
		const source = 'const worker_default = { async fetch() {} };\nexport {\n  worker_default as default\n};\n';

		const result = addCafeteriaScheduledHandler(source, '../src/lib/server/cafeteria-cron');

		expect(result).toContain("import { refreshCafeteriaMenuOnSchedule } from '../src/lib/server/cafeteria-cron';");
		expect(result).toContain('async scheduled(controller, env, ctx)');
		expect(result).toContain('refreshCafeteriaMenuOnSchedule(controller.cron, env, ctx)');
		expect(result).toContain('export { worker_with_cafeteria_schedule as default };');
	});
});
