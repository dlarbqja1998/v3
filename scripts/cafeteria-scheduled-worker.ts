const defaultExport = 'export {\n  worker_default as default\n};';

export function addCafeteriaScheduledHandler(workerSource: string, cronModulePath: string) {
	if (!workerSource.includes(defaultExport)) {
		throw new Error('Cloudflare Worker 기본 export를 찾지 못했습니다.');
	}

	return workerSource.replace(
		defaultExport,
		`import { refreshCafeteriaMenuOnSchedule } from '${cronModulePath}';

const worker_with_cafeteria_schedule = {
	...worker_default,
	async scheduled(controller, env, ctx) {
		await refreshCafeteriaMenuOnSchedule(controller.cron, env, ctx);
	}
};

export { worker_with_cafeteria_schedule as default };`
	);
}
