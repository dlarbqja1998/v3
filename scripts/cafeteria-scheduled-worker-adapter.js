// @ts-nocheck
import adapter from '@sveltejs/adapter-cloudflare';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { addCafeteriaScheduledHandler } from './cafeteria-scheduled-worker.ts';

export function cloudflareAdapterWithCafeteriaSchedule() {
	const cloudflareAdapter = adapter();
	const originalAdapt = cloudflareAdapter.adapt;

	return {
		...cloudflareAdapter,
		async adapt(builder) {
			await originalAdapt(builder);

			const workerPath = path.resolve(process.cwd(), 'worker/index.ts');
			const cronModulePath = path
				.relative(path.dirname(workerPath), path.resolve(process.cwd(), 'src/lib/server/cafeteria-cron'))
				.replaceAll('\\', '/');
			const importPath = cronModulePath.startsWith('.') ? cronModulePath : `./${cronModulePath}`;
			const workerSource = readFileSync(workerPath, 'utf8');

			writeFileSync(workerPath, addCafeteriaScheduledHandler(workerSource, importPath));
		}
	};
}
