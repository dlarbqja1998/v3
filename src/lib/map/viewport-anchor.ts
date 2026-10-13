type ViewportLayout = { mapHeight: number; topOverlayHeight: number; bottomOverlayHeight: number };

/** 같은 지도를 탐색하는 동안 필터·시트 높이가 구역 판정점을 옮기지 않게 한다. */
export function createViewportAnchor() {
	let targetRatio: number | undefined;
	return {
		resolve({ mapHeight, topOverlayHeight, bottomOverlayHeight }: ViewportLayout) {
			if (targetRatio === undefined) {
				const height = Math.max(1, mapHeight);
				targetRatio = Math.max(0, Math.min(1, (topOverlayHeight + height - bottomOverlayHeight) / (2 * height)));
			}
			return targetRatio;
		},
		reset() { targetRatio = undefined; }
	};
}
