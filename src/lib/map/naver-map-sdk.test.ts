import { describe, expect, it } from 'vitest';
import * as naverMapSdk from './naver-map-sdk';
import { loadNaverMapSdk, type NaverMapSdkEnvironment } from './naver-map-sdk';

class FakeScript extends EventTarget {
	src = '';
	async = false;
	defer = false;
	dataset: Record<string, string | undefined> = {};
	removed = false;

	remove() {
		this.removed = true;
	}
}

function createEnvironment(existingScript: FakeScript | null = null) {
	let sdkReady = false;
	const appendedScripts: FakeScript[] = [];
	const environment: NaverMapSdkEnvironment = {
		hasSdk: () => sdkReady,
		findScript: () => existingScript,
		createScript: () => new FakeScript(),
		appendScript: (script) => appendedScripts.push(script as FakeScript),
		setTimer: () => 1,
		clearTimer: () => undefined
	};

	return {
		environment,
		appendedScripts,
		setSdkReady: (value: boolean) => {
			sdkReady = value;
		}
	};
}

describe('네이버 지도 SDK 로더', () => {
	it('완료 상태를 알 수 없는 기존 스크립트는 버리고 새 요청으로 복구한다', async () => {
		const staleScript = new FakeScript();
		const { environment, appendedScripts, setSdkReady } = createEnvironment(staleScript);

		const loading = loadNaverMapSdk('client-id', environment);

		expect(staleScript.removed).toBe(true);
		expect(appendedScripts).toHaveLength(1);
		setSdkReady(true);
		appendedScripts[0].dispatchEvent(new Event('load'));
		await expect(loading).resolves.toBeUndefined();
	});

	it('SDK 요청 실패 시 실패한 스크립트를 제거해 다음 재시도를 막지 않는다', async () => {
		const { environment, appendedScripts } = createEnvironment();
		const loading = loadNaverMapSdk('client-id', environment);

		appendedScripts[0].dispatchEvent(new Event('error'));

		await expect(loading).rejects.toThrow('네이버 지도 SDK');
		expect(appendedScripts[0].removed).toBe(true);
	});

	it('첫 SDK 요청이 실패하면 새 스크립트로 한 번 자동 재시도한다', async () => {
		const loadWithRetry = (
			naverMapSdk as Partial<{
				loadNaverMapSdkWithRetry: (
					clientId: string,
					environment: NaverMapSdkEnvironment
				) => Promise<void>;
			}>
		).loadNaverMapSdkWithRetry;
		expect(loadWithRetry).toBeTypeOf('function');
		if (!loadWithRetry) return;

		const { environment, appendedScripts, setSdkReady } = createEnvironment();
		const loading = loadWithRetry('client-id', environment);
		appendedScripts[0].dispatchEvent(new Event('error'));
		await Promise.resolve();

		expect(appendedScripts).toHaveLength(2);
		setSdkReady(true);
		appendedScripts[1].dispatchEvent(new Event('load'));
		await expect(loading).resolves.toBeUndefined();
	});
});

describe('네이버 지도 컨테이너 준비', () => {
	it('레이아웃 높이가 0인 동안 기다렸다가 실제 크기가 생긴 뒤 반환한다', async () => {
		const waitForRenderableSize = (
			naverMapSdk as Partial<{
				waitForRenderableMapSize: (
					measure: () => { width: number; height: number },
					waitForNextLayout: () => Promise<void>,
					maxAttempts?: number
				) => Promise<{ width: number; height: number }>;
			}>
		).waitForRenderableMapSize;
		expect(waitForRenderableSize).toBeTypeOf('function');
		if (!waitForRenderableSize) return;

		const sizes = [
			{ width: 390, height: 0 },
			{ width: 390, height: 0 },
			{ width: 390, height: 844 }
		];
		let layoutIndex = 0;

		const size = await waitForRenderableSize(
			() => sizes[layoutIndex],
			async () => {
				layoutIndex += 1;
			},
			3
		);

		expect(size).toEqual({ width: 390, height: 844 });
	});

	it('컨테이너 크기가 계속 0이면 무한 대기하지 않고 실패한다', async () => {
		const waitForRenderableSize = (
			naverMapSdk as Partial<{
				waitForRenderableMapSize: (
					measure: () => { width: number; height: number },
					waitForNextLayout: () => Promise<void>,
					maxAttempts?: number
				) => Promise<{ width: number; height: number }>;
			}>
		).waitForRenderableMapSize;
		expect(waitForRenderableSize).toBeTypeOf('function');
		if (!waitForRenderableSize) return;

		await expect(
			waitForRenderableSize(
				() => ({ width: 390, height: 0 }),
				async () => undefined,
				2
			)
		).rejects.toThrow('컨테이너 크기');
	});
});

describe('네이버 지도 타일 URL', () => {
	it('HTTP 전용 지도 타일 호스트를 네이버 HTTPS CDN으로 바꾼다', () => {
		const rewriteTileUrls = (
			naverMapSdk as Partial<{
				rewriteNaverMapTileUrls: (urls: string | string[]) => string | string[];
			}>
		).rewriteNaverMapTileUrls;
		expect(rewriteTileUrls).toBeTypeOf('function');
		if (!rewriteTileUrls) return;

		expect(
			rewriteTileUrls([
				'http://nrbe.map.naver.net/styles/basic/1/16/1/2.png?mt=bg',
				'http://nrb.map.naver.net/styles/basic/1/16/1/2.png?mt=bg',
				'https://example.com/other.png'
			])
		).toEqual([
			'https://nrbe.pstatic.net/styles/basic/1/16/1/2.png?mt=bg',
			'https://map.pstatic.net/nrb/styles/basic/1/16/1/2.png?mt=bg',
			'https://example.com/other.png'
		]);
	});

	it('현재 지도 유형의 타일 생성기를 HTTPS 방식으로 교체하고 새로고침한다', () => {
		const enableSecureTiles = (
			naverMapSdk as Partial<{
				enableSecureNaverMapTiles: (map: unknown) => boolean;
			}>
		).enableSecureNaverMapTiles;
		expect(enableSecureTiles).toBeTypeOf('function');
		if (!enableSecureTiles) return;

		let appliedOptions: { getTileUrl: (...args: number[]) => string | string[] } | undefined;
		let refreshCount = 0;
		const mapTypeOptions = {
			getTileUrl: () => 'http://nrbe.map.naver.net/styles/basic/1/16/1/2.png?mt=bg'
		};
		const map = {
			getMapType: () => ({
				getMapTypeOptions: () => mapTypeOptions,
				setMapTypeOptions: (options: typeof mapTypeOptions) => {
					appliedOptions = options;
				}
			}),
			refresh: () => {
				refreshCount += 1;
			}
		};

		expect(enableSecureTiles(map)).toBe(true);
		expect(appliedOptions?.getTileUrl(1, 2, 16)).toBe(
			'https://nrbe.pstatic.net/styles/basic/1/16/1/2.png?mt=bg'
		);
		expect(refreshCount).toBe(1);
	});
});
