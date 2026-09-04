export type NaverMapSdkScript = EventTarget & {
	src: string;
	async: boolean;
	defer: boolean;
	dataset: Record<string, string | undefined>;
	remove(): void;
};

export type NaverMapSdkEnvironment = {
	hasSdk(): boolean;
	findScript(): NaverMapSdkScript | null;
	createScript(): NaverMapSdkScript;
	appendScript(script: NaverMapSdkScript): void;
	setTimer(callback: () => void, delayMs: number): number;
	clearTimer(timerId: number): void;
};

const scriptSelector = 'script[data-naver-map-sdk]';
const scriptStateKey = 'naverMapSdkState';
const loadTimeoutMs = 10_000;

export type RenderableMapSize = {
	width: number;
	height: number;
};

export async function waitForRenderableMapSize(
	measure: () => RenderableMapSize,
	waitForNextLayout: () => Promise<void>,
	maxAttempts = 60
): Promise<RenderableMapSize> {
	for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
		const size = measure();
		if (size.width > 0 && size.height > 0) return size;
		if (attempt < maxAttempts - 1) await waitForNextLayout();
	}

	throw new Error('네이버 지도 컨테이너 크기를 확인할 수 없습니다.');
}

type NaverTileUrls = string | string[];

export function rewriteNaverMapTileUrls(urls: NaverTileUrls): NaverTileUrls {
	const rewrite = (url: string) =>
		url
			.replace(
				/^http:\/\/nrbe\.map\.naver\.net\/styles/,
				'https://nrbe.pstatic.net/styles'
			)
			.replace(
				/^http:\/\/nrb\.map\.naver\.net\/styles/,
				'https://map.pstatic.net/nrb/styles'
			);

	return Array.isArray(urls) ? urls.map(rewrite) : rewrite(urls);
}

export function enableSecureNaverMapTiles(mapValue: unknown): boolean {
	const map = mapValue as {
		getMapType?: () => {
			getMapTypeOptions?: () => {
				getTileUrl?: (...args: number[]) => NaverTileUrls;
			};
			setMapTypeOptions?: (options: unknown) => void;
		};
		refresh?: () => void;
	};
	const mapType = map.getMapType?.();
	const options = mapType?.getMapTypeOptions?.();
	const originalGetTileUrl = options?.getTileUrl;
	if (!mapType?.setMapTypeOptions || !options || !originalGetTileUrl || !map.refresh) return false;

	options.getTileUrl = function (...args: number[]) {
		return rewriteNaverMapTileUrls(originalGetTileUrl.apply(this, args));
	};
	mapType.setMapTypeOptions(options);
	map.refresh();
	return true;
}

export function loadNaverMapSdk(
	clientId: string,
	environment: NaverMapSdkEnvironment = createBrowserEnvironment()
): Promise<void> {
	if (environment.hasSdk()) return Promise.resolve();

	let script = environment.findScript();
	if (script && script.dataset[scriptStateKey] !== 'loading') {
		script.remove();
		script = null;
	}

	if (!script) {
		script = environment.createScript();
		script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
		script.async = true;
		script.defer = true;
		script.dataset.naverMapSdk = 'true';
		script.dataset[scriptStateKey] = 'loading';
		environment.appendScript(script);
	}

	return waitForSdk(script, environment);
}

export async function loadNaverMapSdkWithRetry(
	clientId: string,
	environment: NaverMapSdkEnvironment = createBrowserEnvironment()
): Promise<void> {
	try {
		await loadNaverMapSdk(clientId, environment);
	} catch {
		await loadNaverMapSdk(clientId, environment);
	}
}

function waitForSdk(script: NaverMapSdkScript, environment: NaverMapSdkEnvironment) {
	return new Promise<void>((resolve, reject) => {
		let settled = false;
		const finish = (callback: () => void) => {
			if (settled) return;
			settled = true;
			environment.clearTimer(timerId);
			script.removeEventListener('load', handleLoad);
			script.removeEventListener('error', handleError);
			callback();
		};
		const fail = (message: string) => {
			script.dataset[scriptStateKey] = 'error';
			script.remove();
			finish(() => reject(new Error(message)));
		};
		const handleLoad = () => {
			if (!environment.hasSdk()) {
				fail('네이버 지도 SDK 전역 객체를 확인할 수 없습니다.');
				return;
			}
			script.dataset[scriptStateKey] = 'loaded';
			finish(resolve);
		};
		const handleError = () => fail('네이버 지도 SDK 요청에 실패했습니다.');
		const timerId = environment.setTimer(
			() => fail('네이버 지도 SDK 응답 시간이 초과되었습니다.'),
			loadTimeoutMs
		);

		script.addEventListener('load', handleLoad, { once: true });
		script.addEventListener('error', handleError, { once: true });

		if (environment.hasSdk()) handleLoad();
	});
}

function createBrowserEnvironment(): NaverMapSdkEnvironment {
	return {
		hasSdk: () => Boolean(window.naver?.maps),
		findScript: () => document.querySelector<HTMLScriptElement>(scriptSelector),
		createScript: () => document.createElement('script'),
		appendScript: (script) => document.head.appendChild(script as HTMLScriptElement),
		setTimer: (callback, delayMs) => window.setTimeout(callback, delayMs),
		clearTimer: (timerId) => window.clearTimeout(timerId)
	};
}
