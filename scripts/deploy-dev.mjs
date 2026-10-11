import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const dryRun = process.argv.includes('--dry-run');
if (process.argv.slice(2).some((arg) => arg !== '--dry-run')) {
	throw new Error('지원하는 옵션은 --dry-run뿐입니다.');
}

const branch = process.env.WORKERS_CI_BRANCH ||
	spawnSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).stdout?.trim();
if (branch !== 'codex/dev') {
	throw new Error('개발 서버 배포는 codex/dev 브랜치에서만 실행할 수 있습니다.');
}

const config = JSON.parse(readFileSync('wrangler.dev.jsonc', 'utf8'));
const production = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
if (
	config.name !== 'v3-dev' || config.main !== 'worker/dev.ts' ||
	config.workers_dev !== false || config.preview_urls !== false ||
	config.routes?.length !== 1 || config.routes[0].pattern !== 'dev.golabau.com' ||
	config.routes[0].custom_domain !== true || config.assets?.run_worker_first !== true ||
	config.triggers?.crons?.length !== 0 ||
	config.vars?.APP_ENV !== 'development' || config.vars?.AUTH_URL !== 'https://dev.golabau.com' ||
	config.kv_namespaces?.length !== 1 || !config.kv_namespaces[0].id ||
	production.kv_namespaces.some((binding) => binding.id === config.kv_namespaces[0].id) ||
	config.r2_buckets?.length !== 1 || config.r2_buckets[0].bucket_name !== 'golabau-media-dev' ||
	production.r2_buckets.some((binding) => binding.bucket_name === config.r2_buckets[0].bucket_name)
) {
	throw new Error('개발 서버의 도메인·인증·저장소 분리 설정을 확인해 주세요.');
}

function run(script, args) {
	const result = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status ?? 1);
}

run('node_modules/vite/bin/vite.js', ['build']);
run('node_modules/wrangler/bin/wrangler.js', [
	'deploy', '--config', 'wrangler.dev.jsonc', ...(dryRun ? ['--dry-run'] : [])
]);
